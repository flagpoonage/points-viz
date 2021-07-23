import React from "react";
import { EventAggregate, RewardEvent } from "./reward-model";
import { Threshold } from "./thresholds";

interface VizProps {
  thresholds: Threshold[];
  events: EventAggregate[];
}

export function getSpendRange (min: number, max: number): number {
  if (min === 0 && max === 0) {
    return 0;
  }

  if (min < 0 && max === 0) {
    return Math.abs(min);
  }

  if (min === 0 && max > 0) {
    return max;
  }

  if ((min < 0 && max < 0) || (min > 0 && max > 0)) {
    return Math.abs(max - min);
  }
  
  
  return Math.abs(min) + max;
  
}

export function getBackgroundColor (type: RewardEvent['type']): string {
  switch (type) {
    case "refund":
      return "red";
    case "spend":
      return "green";
    case "tax-refund":
      return "orange";
    case "tax-spend":
      return "blue";
  }
}

export function Viz({ events, thresholds }: VizProps) {
  const max_spend = events.reduce(
    (acc, val) => (val.spendBalance > acc ? val.spendBalance : acc),
    0
  );

  const min_spend = events.reduce(
    (acc, val) => (val.spendBalance < acc ? val.spendBalance : acc),
    0
  );

  const utilized_thresholds = thresholds.filter(
    (a) => a.activeFrom < max_spend && a.activeFrom > min_spend
  );

  const spend_range = getSpendRange(min_spend, max_spend);

  const ratio = 100 / spend_range;

  const has_negative = min_spend < 0;

  console.log('Range', min_spend, max_spend, spend_range, ratio);

  const data = events.map((e) => (
    <div style={{ position: "relative", height: "20px", padding: "5px 0" }}>
      {e.segments.map((s) => (
        <div
          style={{
            position: "absolute",
            top: "5px",
            left: `${ratio * (s.start + (has_negative ? Math.abs(min_spend) : 0))}%`,
            height: "20px",
            width: `${ratio * Math.abs(s.value)}%`,
            backgroundColor: getBackgroundColor(e.event.type),
          }}
        ></div>
      ))}
    </div>
  ));

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {data}
      {utilized_thresholds.map((a) => (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${ratio * (has_negative ? Math.abs(min_spend) + a.activeFrom : a.activeFrom)}%`,
            borderLeft: 'dashed 1px black',
            // backgroundColor: "blue",
            height: "100%",
          }}
        ></div>
      ))}
    </div>
  );
}
