import { useMemo, useState } from 'react';
import {
  Threshold,
  highestFirstThresholds,
  useThresholds,
  BASE_THRESHOLD_ID,
} from './thresholds';
import { v4 as uuid } from 'uuid';
import { CardConfiguration, CUSTOM_CARD_DEFAULT } from './card-configuration';
import { testEvents } from './test';

export interface BaseRewardEvent {
  id: string;
  value: number;
}

export interface SpendEvent extends BaseRewardEvent {
  type: 'spend';
}

export interface RefundEvent extends BaseRewardEvent {
  type: 'refund';
}

export interface TaxSpendEvent extends BaseRewardEvent {
  type: 'tax-spend';
}

export interface TaxRefundEvent extends BaseRewardEvent {
  type: 'tax-refund';
}

export type RewardEvent =
  | SpendEvent
  | RefundEvent
  | TaxSpendEvent
  | TaxRefundEvent;

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
  csSegments: EventSegment[];
  ecsSegments: EventSegment[];
  currentPointsBalance: number;
  currentCumulativeSpend: number;
  currentExclusiveCumulativeSpend: number;
}

function createTaxSegments(
  value: number,
  maximum: number,
  minimum: number,
  taxRate: number
): EventSegment[] {
  if (minimum >= 0) {
    return [
      {
        start: minimum,
        end: maximum,
        value: value,
        points: taxRate * value,
        threshold_id: 'tax',
      },
    ];
  } else if (maximum <= 0) {
    return [
      {
        start: minimum,
        end: maximum,
        value,
        points: taxRate * value,
        threshold_id: 'tax',
      },
    ];
  } else {
    return [
      {
        start: minimum,
        end: 0,
        value: minimum,
        points: taxRate * value,
        threshold_id: 'tax',
      },
      {
        start: 0,
        end: maximum,
        value: maximum,
        points: taxRate * value,
        threshold_id: 'tax',
      },
    ];
  }
}

function createSegments(
  value: number,
  maximum: number,
  minimum: number,
  thresholds: Threshold[]
): EventSegment[] {
  const segments: EventSegment[] = [];

  const t1 = thresholds.find((a) => a.id === BASE_THRESHOLD_ID);

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
      points: t1.multiplier * value_remainder,
      threshold_id: BASE_THRESHOLD_ID,
    });
  }

  return segments;
}

interface SplitEventSegments {
  cs: EventSegment[];
  ecs: EventSegment[];
}

function splitEventByThresholds(
  currentCs: number,
  currentEcs: number,
  event: RewardEvent,
  thresholds: Threshold[],
  taxRate: number
): SplitEventSegments {
  if (event.type === 'tax-spend') {
    const cs = splitTaxSpend(currentCs, event, taxRate);
    return { cs, ecs: cs };
  } else if (event.type === 'tax-refund') {
    const cs = splitTaxRefund(currentCs, event, taxRate);
    return { cs, ecs: cs };
  } else if (event.type === 'refund') {
    return splitRefundByThresholds(currentCs, currentEcs, event, thresholds);
  }

  return splitSpendByThresholds(currentCs, currentEcs, event, thresholds);
}

function splitSpendByThresholds(
  currentCs: number,
  currentEcs: number,
  event: SpendEvent,
  thresholds: Threshold[]
): SplitEventSegments {
  let maximum = event.value + currentCs;
  let minimum = currentCs;

  let ecs_maximum = event.value + currentEcs;
  let ecs_minimum = currentEcs;

  const cs = createSegments(event.value, maximum, minimum, thresholds).map(
    (a) => ({
      ...a,
      points: a.end === 0 ? 0 : a.points,
    })
  );

  let ecs =
    ecs_minimum === minimum
      ? cs
      : createSegments(event.value, ecs_maximum, ecs_minimum, thresholds);

  return {
    cs,
    ecs,
  };
}
function splitRefundByThresholds(
  currentCs: number,
  currentEcs: number,
  event: RefundEvent,
  thresholds: Threshold[]
): SplitEventSegments {
  let maximum = currentCs;
  let minimum = currentCs - event.value;

  let ecs_maximum = currentEcs;
  let ecs_minimum = currentEcs - event.value;

  const cs = createSegments(event.value, maximum, minimum, thresholds).map(
    (a) => ({
      ...a,
      value: -a.value,
      points: -a.points,
    })
  );

  let ecs =
    ecs_minimum === minimum
      ? cs
      : createSegments(event.value, ecs_maximum, ecs_minimum, thresholds).map(
          (a) => ({
            ...a,
            value: -a.value,
            points: -a.points,
          })
        );

  return {
    cs,
    ecs,
  };
}

function splitTaxRefund(
  start: number,
  event: TaxRefundEvent,
  taxRate: number
): EventSegment[] {
  let maximum = start;
  let minimum = start - event.value;

  return createTaxSegments(event.value, maximum, minimum, taxRate).map((a) => ({
    ...a,
    value: -a.value,
    points: -a.points,
  }));
}

function splitTaxSpend(
  start: number,
  event: TaxSpendEvent,
  taxRate: number
): EventSegment[] {
  let maximum = event.value + start;
  let minimum = start;

  return createTaxSegments(event.value, maximum, minimum, taxRate);
}

export function useEvents(
  points: number,
  thresholds: Threshold[],
  taxRate: number
) {
  const [events, setEvents] = useState<RewardEvent[]>(
    [] // testEvents as RewardEvent[]
  );

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
      const segments = splitEventByThresholds(
        acc.cs,
        acc.ecs,
        val,
        highestThresholds,
        taxRate
      );
      const segment_points = segments.ecs.reduce((a, val) => a + val.points, 0);

      if (val.type === 'refund' || val.type === 'tax-refund') {
        acc.cs -= val.value;
        if (val.type === 'refund') {
          acc.ecs -= val.value;
        }
      } else {
        acc.cs += val.value;
        if (val.type === 'spend') {
          acc.ecs += val.value;
        }
      }

      if (acc.ecs < 0) {
        acc.ecs = 0;
      }

      acc.p += segment_points;

      const row = {
        id: val.id,
        event: val,
        ecsSegments: segments.ecs,
        csSegments: segments.cs,
        currentCumulativeSpend: acc.cs,
        currentPointsBalance: acc.p,
        currentExclusiveCumulativeSpend: acc.ecs,
      } as EventAggregate;

      console.log(val, segments);

      acc.v.push(row);
      return acc;
    },
    { v: [] as EventAggregate[], cs: 0, ecs: 0, p: points }
  );

  return { events, values: aggregate.v, addEvent, removeEvent };
}

export function useRewardModel() {
  const [selectedCard, _setSelectedCard] =
    useState<CardConfiguration>(CUSTOM_CARD_DEFAULT);

  const [taxRate, setTaxRate] = useState<'' | number>(0.5);
  const [baseMultiplier, setBaseMultiplier] = useState(1);
  const [startingPoints, setStartingPoints] = useState<'' | number>(0);

  const {
    addThreshold,
    removeThreshold,
    thresholds,
    updateThreshold,
    setThresholds,
  } = useThresholds(baseMultiplier);

  const { events, addEvent, removeEvent, values } = useEvents(
    startingPoints || 0,
    thresholds,
    taxRate || 0
  );

  function setSelectedCard(preset: CardConfiguration) {
    _setSelectedCard(preset);
    setTaxRate(preset.taxRate);
    setBaseMultiplier(preset.thresholds[0].multiplier);
    setThresholds(preset.thresholds);
  }

  return {
    selectedCard,
    setSelectedCard: setSelectedCard,
    addThreshold,
    removeThreshold,
    updateThreshold,
    setBaseMultiplier,
    baseMultiplier,
    thresholds: thresholds,
    addEvent,
    events,
    taxRate,
    setTaxRate,
    removeEvent,
    startingPoints,
    setStartingPoints,
    values,
  };
}

export function formatCurrency(value: number) {
  return `$${(value / 100).toFixed(2)}`;
}
export function formatDollars(value: number) {
  return `$${(value / 100).toFixed(0)}`;
}
