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

export type RewardEvent = SpendEvent | RefundEvent;

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

function createSegments(
  value: number,
  maximum: number,
  minimum: number,
  thresholds: Threshold[]
): EventSegment[] {
  const segments = [];

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

    value_remainder = value_remainder - applicable_value;
  }

  return segments;
}

function splitEventByThresholds(
  start: number,
  event: RewardEvent,
  thresholds: Threshold[]
): EventSegment[] {
  return event.type === "refund"
    ? splitRefundByThresholds(start, event, thresholds)
    : splitSpendByThresholds(start, event, thresholds);
}

function splitSpendByThresholds(
  start: number,
  event: SpendEvent,
  thresholds: Threshold[]
): EventSegment[] {
  let maximum = event.value + start;
  let minimum = start;

  console.log("Split", start, event, maximum, minimum);

  return createSegments(event.value, maximum, minimum, thresholds);
}
function splitRefundByThresholds(
  start: number,
  event: RefundEvent,
  thresholds: Threshold[]
): EventSegment[] {
  let maximum = start;
  let minimum = start - event.value;

  return createSegments(event.value, maximum, minimum, thresholds).map((a) => ({
    ...a,
    value: -a.value,
    points: -a.points,
  }));
}

export function useEvents(cumulation: number, thresholds: Threshold[]) {
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

  const initialHiddenSegments = splitSpendByThresholds(
    0,
    {
      id: uuid(),
      type: "spend",
      value: cumulation,
    },
    highestThresholds
  );

  const initialPoints = initialHiddenSegments.reduce((acc, val) => {
    return acc + val.points;
  }, 0);

  const aggregate = events.reduce(
    (acc, val) => {
      const segments = splitEventByThresholds(acc.c, val, highestThresholds);
      const segment_points = segments.reduce((a, val) => a + val.points, 0);

      if (val.type === "refund") {
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
    { v: [] as EventAggregate[], c: cumulation, p: initialPoints }
  );

  return { events, values: aggregate.v, addEvent, removeEvent };
}

export function useRewardModel(
  initMultiplier: number = 1,
  initCumulation: number = 0
) {
  const [baseMultiplier, setBaseMultiplier] = useState(initMultiplier);
  const [startingAccumulation, setStartingAccumulation] = useState<"" | number>(
    initCumulation
  );
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
    combinedThresholds
  );

  return {
    addThreshold,
    removeThreshold,
    updateThreshold,
    setBaseMultiplier,
    baseMultiplier,
    thresholds: combinedThresholds,
    addEvent,
    events,
    removeEvent,
    startingAccumulation,
    setStartingAccumulation,
    values,
  };
}

export function formatCurrency(value: number) {
  return `$${(value / 100).toFixed(2)}`;
}
