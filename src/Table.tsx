import React from "react";
import { EventAggregate, formatCurrency, RewardEvent } from "./reward-model";
import { Threshold } from "./thresholds";

interface TableProps {
  thresholds: Threshold[];
  values: EventAggregate[];
  removeEvent: (e: RewardEvent) => void;
}

export function getEventName (type: RewardEvent["type"]): string {
  switch (type) {
    case "refund":
      return "Refund";
    case "spend":
      return "Spend";
    case "tax-refund":
      return "Tax Refund";
    case "tax-spend":
      return "Tax Spend";
  }
}

export function Table({ thresholds, values, removeEvent }: TableProps) {

  const has_tax = values.some(a => a.event.type === "tax-refund" || a.event.type === "tax-spend");

  return (
    <table style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Event</th>
          <th>Cumulative Spend</th>
          {has_tax && (
            <th>{`Tax accrual points`}</th>
          )}
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
              {`${getEventName(v.event.type)} of ${formatCurrency(v.event.value)}`}
            </td>
            <td>{formatCurrency(v.spendBalance)}</td>
            {has_tax && ((v.event.type === "tax-refund" || v.event.type === "tax-spend") ? <td>{v.segments[0].points / 100}</td> : <td>-</td>)}
            {thresholds.map((t, i) => {
              const segments = v.segments.filter((a) => a.threshold_id === t.id);
              if (segments.length === 0) {
                return <td>-</td>;
              }

              return <td>{segments.reduce((acc, val) => acc + val.points, 0) / 100}</td>;
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
