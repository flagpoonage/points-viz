import { useMemo, useState } from "react";
import { Threshold, highestFirstThresholds, useThresholds } from "./thresholds";
import { v4 as uuid } from "uuid";

export interface BaseRewardEvent {
  id: string;
  value: number;
}

export interface SpendEvent extends BaseRewardEvent {
  type: "spend";
}

export interface RefundEvent extends BaseRewardEvent {
  type: "refund";
}

export interface TaxSpendEvent extends BaseRewardEvent {
  type: "tax-spend"
}

export interface TaxRefundEvent extends BaseRewardEvent {
  type: "tax-refund"
}

export type RewardEvent = SpendEvent | RefundEvent | TaxSpendEvent | TaxRefundEvent;

export interface EventSegment {
  start: number;
  end: number;
  value: number;
  points: number;
  threshold_id: string;
}

export interface EventAggregate {
  id: string;
  event: RewardEvent;
  segments: EventSegment[];
  pointsBalance: number;
  spendBalance: number;
}

function createTaxSegments (
  value: number,
  maximum: number,
  minimum: number,
  taxRate: number,
  applyNegativePoints: boolean
): EventSegment[] {
  if (minimum >= 0) {
    return [{
      start: minimum,
      end: maximum,
      value: value,
      points: taxRate * value,
      threshold_id: 'tax'
    }];
  }
  else if (maximum <= 0) {
    return [{
      start: minimum,
      end: maximum,
      value,
      points: applyNegativePoints ? taxRate * value : 0,
      threshold_id: 'tax'
    }];
  }
  else {
    return [{
      start: minimum,
      end: 0,
      value: minimum,
      points: applyNegativePoints ? taxRate * value : 0,
      threshold_id: 'tax'
    }, {
      start: 0,
      end: maximum,
      value: maximum,
      points: taxRate * value,
      threshold_id: 'tax'
    }]
  }
}

function createSegments(
  value: number,
  maximum: number,
  minimum: number,
  thresholds: Threshold[],
  applyNegativePoints: boolean
): EventSegment[] {
  const segments = [];

  const t1 = thresholds.find(a => a.id === 'base');

  if (!t1) {
    throw new Error('Unable to find base threshold');
  }

  let value_remainder = value;
  let previous_cutoff = maximum;

  for (let i = 0; i < thresholds.length; i++) {
    const current_threshold = thresholds[i];
    if (maximum <= current_threshold.activeFrom) {
      // These thresholds are above where we are operating
      continue;
    }

    if (minimum >= current_threshold.activeFrom) {
      segments.push({
        start: minimum,
        end: previous_cutoff,
        value: value_remainder,
        points: value_remainder * current_threshold.multiplier,
        threshold_id: current_threshold.id,
      });
      value_remainder = 0;
      break;
    }

    const applicable_value = previous_cutoff - current_threshold.activeFrom;
    segments.push({
      start: current_threshold.activeFrom,
      end: previous_cutoff,
      value: applicable_value,
      points: applicable_value * current_threshold.multiplier,
      threshold_id: current_threshold.id,
    });

    previous_cutoff = current_threshold.activeFrom;
    value_remainder = value_remainder - applicable_value;
  }

  if (value_remainder) {
    segments.push({
      start: previous_cutoff - value_remainder,
      end: previous_cutoff,
      value: value_remainder,
      points: applyNegativePoints ? t1.multiplier * value_remainder : 0,
      threshold_id: applyNegativePoints ? "base" : "-1"
    });
  }

  return segments;
}

function splitEventByThresholds(
  start: number,
  event: RewardEvent,
  thresholds: Threshold[],
  taxRate: number,
  applyNegativePoints: boolean
): EventSegment[] {

  if (event.type === "tax-spend") {
    return splitTaxSpend(start, event, taxRate, applyNegativePoints);
  }
  else if (event.type === 'tax-refund') {
    return splitTaxRefund(start, event, taxRate, applyNegativePoints);
  }

  return event.type === "refund"
    ? splitRefundByThresholds(start, event, thresholds, applyNegativePoints)
    : splitSpendByThresholds(start, event, thresholds, applyNegativePoints);
}

function splitSpendByThresholds(
  start: number,
  event: SpendEvent,
  thresholds: Threshold[],
  applyNegativePoints: boolean
): EventSegment[] {
  let maximum = event.value + start;
  let minimum = start;

  console.log("Split", start, event, maximum, minimum);

  return createSegments(event.value, maximum, minimum, thresholds, applyNegativePoints);
}
function splitRefundByThresholds(
  start: number,
  event: RefundEvent,
  thresholds: Threshold[],
  applyNegativePoints: boolean
): EventSegment[] {
  let maximum = start;
  let minimum = start - event.value;

  return createSegments(event.value, maximum, minimum, thresholds, applyNegativePoints).map((a) => ({
    ...a,
    value: -a.value,
    points: -a.points,
  }));
}

function splitTaxRefund(
  start: number,
  event: TaxRefundEvent,
  taxRate: number,
  applyNegativePoints: boolean
): EventSegment[] {
  let maximum = start;
  let minimum = start - event.value;

  return createTaxSegments(event.value, maximum, minimum, taxRate, applyNegativePoints);
}

function splitTaxSpend(
  start: number,
  event: TaxSpendEvent,
  taxRate: number,
  applyNegativePoints: boolean
): EventSegment[] {
  let maximum = event.value + start;
  let minimum = start;

  return createTaxSegments(event.value, maximum, minimum, taxRate, applyNegativePoints);
}

export function useEvents(cumulation: number, points: number, thresholds: Threshold[], taxRate: number, applyNegativePoints: boolean) {
  const [events, setEvents] = useState<RewardEvent[]>([]);

  function addEvent(event: RewardEvent) {
    setEvents([...events, event]);
  }

  function removeEvent(event: RewardEvent) {
    const idx = events.findIndex((a) => a.id === event.id);

    const results = events.slice();
    results.splice(idx, 1);
    setEvents(results);
  }

  const highestThresholds = highestFirstThresholds(thresholds);

  const aggregate = events.reduce(
    (acc, val) => {
      const segments = splitEventByThresholds(acc.c, val, highestThresholds, taxRate, applyNegativePoints);
      const segment_points = segments.reduce((a, val) => a + val.points, 0);

      if (val.type === "refund" || val.type === "tax-refund") {
        acc.c -= val.value;
      } else {
        acc.c += val.value;
      }

      acc.p += segment_points;

      const row = {
        id: val.id,
        event: val,
        segments,
        spendBalance: acc.c,
        pointsBalance: acc.p,
      };

      console.log(val, segments);

      acc.v.push(row);
      return acc;
    },
    { v: [] as EventAggregate[], c: cumulation, p: points }
  );

  return { events, values: aggregate.v, addEvent, removeEvent };
}

export function useRewardModel() {
  const [applyNegativePoints, setApplyNegativePoints] = useState(true);
  const [taxRate, setTaxRate] = useState<"" | number>(0.5);
  const [baseMultiplier, setBaseMultiplier] = useState(1);
  const [startingAccumulation, setStartingAccumulation] = useState<"" | number>(
    0
  );
  const [startingPoints, setStartingPoints] = useState<"" | number>(0);

  const { addThreshold, removeThreshold, thresholds, updateThreshold } =
    useThresholds();

  const baseThreshold: Threshold = {
    id: "base",
    activeFrom: 0,
    multiplier: baseMultiplier,
  };

  const combinedThresholds = [baseThreshold, ...thresholds];

  const { events, addEvent, removeEvent, values } = useEvents(
    startingAccumulation || 0,
    startingPoints || 0,
    combinedThresholds,
    taxRate || 0,
    applyNegativePoints
  );

  return {
    addThreshold,
    removeThreshold,
    updateThreshold,
    setBaseMultiplier,
    baseMultiplier,
    thresholds: combinedThresholds,
    applyNegativePoints,
    setApplyNegativePoints,
    addEvent,
    events,
    taxRate,
    setTaxRate,
    removeEvent,
    startingAccumulation,
    startingPoints,
    setStartingAccumulation,
    setStartingPoints,
    values,
  };
}

export function formatCurrency(value: number) {
  return `$${(value / 100).toFixed(2)}`;
}
