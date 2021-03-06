import { useState } from 'react';
import { v4 as uuid } from 'uuid';

export const BASE_THRESHOLD_ID = 'Tier 1';

export interface Threshold {
  id: string;
  activeFrom: number;
  multiplier: number;
}

export const DEFAULT_BASE_THRESHOLD = {
  id: BASE_THRESHOLD_ID,
  activeFrom: 0,
  multiplier: 1,
};

export function newThreshold(
  activeFrom: number,
  multiplier: number
): Threshold {
  return {
    id: uuid(),
    activeFrom,
    multiplier,
  };
}

export function highestFirstThresholds(t: Threshold[]): Threshold[] {
  const tr = t.slice();
  tr.sort((a, b) => {
    if (a.activeFrom > b.activeFrom) {
      return -1;
    } else if (b.activeFrom > a.activeFrom) {
      return 1;
    }

    return 0;
  });

  return tr;
}

export function lowestFirstThresholds(t: Threshold[]): Threshold[] {
  const tr = t.slice();
  tr.sort((a, b) => {
    if (a.activeFrom > b.activeFrom) {
      return 1;
    } else if (b.activeFrom > a.activeFrom) {
      return -1;
    }

    return 0;
  });

  return tr;
}

export function useThresholds(baseMultiplier: number) {
  const [thresholds, setThresholds] = useState<Threshold[]>([
    {
      id: BASE_THRESHOLD_ID,
      activeFrom: 0,
      multiplier: baseMultiplier,
    },
  ]);

  function addThreshold(t: Threshold) {
    const result = thresholds.concat([t]);
    setThresholds(result);
  }

  function updateThreshold(t: Threshold) {
    const idx = thresholds.findIndex((a) => a.id === t.id);

    const result = thresholds.slice();
    result.splice(idx, 1, t);
    setThresholds(result);
  }

  function removeThreshold(t: Threshold) {
    const idx = thresholds.findIndex((a) => a.id === t.id);

    const result = thresholds.slice();
    result.splice(idx, 1);
    setThresholds(result);
  }

  return {
    thresholds,
    addThreshold,
    removeThreshold,
    updateThreshold,
    setThresholds,
  };
}
