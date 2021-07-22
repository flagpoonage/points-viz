import React from "react";
import { EventAggregate, formatCurrency, RewardEvent } from "./reward-model";
import { Threshold } from "./thresholds";

interface TableProps {
  thresholds: Threshold[];
  values: EventAggregate[];
  removeEvent: (e: RewardEvent) => void;
}

export function Table({ thresholds, values, removeEvent }: TableProps) {
  return (
    <table style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Event</th>
          <th>Cumulative Spend</th>
          {thresholds.map((t, i) => (
            <th>{`Accrual at T${i + 1} points`}</th>
          ))}
          <th>Total Accrual</th>
          <th>Running Balance</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {values.map((v) => (
          <tr>
            <td>
              {`${
                v.event.type === "refund" ? "Refund" : "Spend"
              } of ${formatCurrency(v.event.value)}`}
            </td>
            <td>{formatCurrency(v.spendBalance)}</td>
            {thresholds.map((t, i) => {
              const segment = v.segments.find((a) => a.threshold_id === t.id);
              if (!segment) {
                return <td>-</td>;
              }

              return <td>{segment.points / 100}</td>;
            })}
            <td>
              {v.segments.reduce((acc, val) => acc + val.points, 0) / 100}
            </td>
            <td>{v.pointsBalance / 100}</td>
            <td>
              <button onClick={() => removeEvent(v.event)}>X</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
