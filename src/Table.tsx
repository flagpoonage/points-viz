import React from 'react';
import { EventAggregate, formatCurrency, RewardEvent } from './reward-model';
import { BASE_THRESHOLD_ID, Threshold } from './thresholds';

interface TableProps {
  thresholds: Threshold[];
  values: EventAggregate[];
  removeEvent: (e: RewardEvent) => void;
}

export function getEventName(type: RewardEvent['type']): string {
  switch (type) {
    case 'refund':
      return 'Refund';
    case 'spend':
      return 'Spend';
    case 'tax-refund':
      return 'Tax Refund';
    case 'tax-spend':
      return 'Tax Spend';
  }
}

const COL_WIDTH = {
  ECS: 180,
  CS: 180,
  TIER: 100,
  TOTAL: 180,
  BALANCE: 180,
  RM: 25,
};

const COL_PX = (
  Object.entries(COL_WIDTH) as [keyof typeof COL_WIDTH, number][]
).reduce((acc, [key, value]) => {
  acc[key] = `${value}px`;
  return acc;
}, {} as Record<keyof typeof COL_WIDTH, string>);

export function Table({ thresholds, values, removeEvent }: TableProps) {
  const has_tax = values.some(
    (a) => a.event.type === 'tax-refund' || a.event.type === 'tax-spend'
  );

  return (
    <table className="event-table" style={{ minWidth: '100%' }}>
      <thead>
        <tr>
          <th>Event</th>
          <th style={{ minWidth: COL_PX.ECS }}>ECS</th>
          <th style={{ minWidth: COL_PX.CS }}>Cumulative Spend</th>
          {thresholds.map((t, i) => (
            <th style={{ minWidth: COL_PX.TIER }}>{`Tier ${i + 1}`}</th>
          ))}
          <th style={{ minWidth: COL_PX.TOTAL }}>Total Accrual</th>
          <th style={{ minWidth: COL_PX.BALANCE }}>Running Balance</th>
          <th style={{ width: COL_PX.RM }}></th>
        </tr>
      </thead>
      <tbody>
        {values.map((v) => (
          <tr>
            <td>
              {`${getEventName(v.event.type)} of ${formatCurrency(
                v.event.value
              )}`}
            </td>
            <td style={{ minWidth: COL_PX.ECS }}>
              {formatCurrency(v.currentExclusiveCumulativeSpend)}
            </td>
            <td style={{ minWidth: COL_PX.CS }}>
              {formatCurrency(v.currentCumulativeSpend)}
            </td>
            {thresholds.map((t, i) => {
              // if (
              //   (v.event.type === 'tax-refund' ||
              //     v.event.type === 'tax-spend') &&
              //   t.id === BASE_THRESHOLD_ID
              // ) {
              //   return (
              //     <td style={{ minWidth: COL_PX.TIER }}>
              //       {v.csSegments.reduce((acc, val) => acc + val.points, 0) /
              //         100}
              //     </td>
              //   );
              // }

              console.log(t.id, i);

              const segments = v.ecsSegments.filter(
                (a) => a.threshold_id === t.id
              );
              if (segments.length === 0) {
                return <td style={{ minWidth: COL_PX.TIER }}>-</td>;
              }

              return (
                <td style={{ minWidth: COL_PX.TIER }}>
                  {segments.reduce((acc, val) => acc + val.points, 0) / 100}
                </td>
              );
            })}
            <td style={{ minWidth: COL_PX.TOTAL }}>
              {v.ecsSegments.reduce((acc, val) => acc + val.points, 0) / 100}
            </td>
            <td style={{ minWidth: COL_PX.BALANCE }}>
              {v.currentPointsBalance / 100}
            </td>
            <td style={{ width: COL_PX.RM }}>
              <button onClick={() => removeEvent(v.event)}>X</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
