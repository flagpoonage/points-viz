import React from "react";
import { EventAggregate } from "./reward-model";
import { Threshold } from "./thresholds";

interface VizProps {
  thresholds: Threshold[];
  events: EventAggregate[];
}

export function Viz({ events, thresholds }: VizProps) {
  const max_spend = events.reduce(
    (acc, val) => (val.spendBalance > acc ? val.spendBalance : acc),
    0
  );

  const utilized_thresholds = thresholds.filter(
    (a) => a.activeFrom < max_spend && a.activeFrom !== 0
  );

  const ratio = 100 / max_spend;

  const data = events.map((e) => (
    <div style={{ position: "relative", height: "20px", padding: "5px 0" }}>
      {e.segments.map((s) => (
        <div
          style={{
            position: "absolute",
            top: "5px",
            left: `${ratio * s.start}%`,
            height: "20px",
            width: `${ratio * Math.abs(s.value)}%`,
            backgroundColor: e.event.type === "refund" ? "red" : "green",
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
            width: "1px",
            top: 0,
            left: `${ratio * a.activeFrom}%`,
            backgroundColor: "blue",
            height: "100%",
          }}
        ></div>
      ))}
    </div>
  );
}
