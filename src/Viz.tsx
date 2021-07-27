import React, { useRef } from 'react';
import {
  EventAggregate,
  formatCurrency,
  formatDollars,
  RewardEvent,
} from './reward-model';
import { Threshold } from './thresholds';

interface VizProps {
  thresholds: Threshold[];
  events: EventAggregate[];
  displayMode: 'ecs' | 'cs';
}

export function getSpendRange(min: number, max: number): number {
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

export function getBackgroundColor(type: RewardEvent['type']): string {
  switch (type) {
    case 'refund':
      return 'red';
    case 'spend':
      return 'green';
    case 'tax-refund':
      return 'orange';
    case 'tax-spend':
      return 'blue';
  }
}

export function Viz({ events, thresholds, displayMode }: VizProps) {
  const cursor = useRef<HTMLDivElement | null>(null);
  const cursorDollar = useRef<HTMLDivElement | null>(null);
  const max_spend = events.reduce(
    (acc, val) =>
      displayMode === 'cs'
        ? val.currentCumulativeSpend > acc
          ? val.currentCumulativeSpend
          : acc
        : val.currentExclusiveCumulativeSpend > acc
        ? val.currentExclusiveCumulativeSpend
        : acc,
    0
  );

  const min_spend = events.reduce(
    (acc, val) =>
      val.currentCumulativeSpend < acc ? val.currentCumulativeSpend : acc,
    0
  );

  const utilized_thresholds = thresholds.filter(
    (a) => a.activeFrom < max_spend && a.activeFrom > min_spend
  );

  const spend_range = getSpendRange(min_spend, max_spend);

  const ratio = 100 / spend_range;

  const has_negative = min_spend < 0;

  function move(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget;

    window.requestAnimationFrame(() => {
      if (!cursor.current) {
        return;
      }
      const rect = target.getBoundingClientRect();
      const offsetX = e.clientX - rect.x;
      const offsetY = e.clientY - rect.top;
      console.log(offsetX, offsetY);
      cursor.current.style.left = `${offsetX}px`;

      if (cursorDollar.current) {
        cursorDollar.current.style.left = `${offsetX}px`;
        let dollars = formatDollars((spend_range / rect.width) * offsetX);
        cursorDollar.current.innerHTML = dollars;
      }
    });
  }

  function enter() {
    if (cursor.current) {
      cursor.current.style.display = 'block';
    }

    if (cursorDollar.current) {
      cursorDollar.current.style.display = 'block';
    }
  }

  function leave() {
    if (cursor.current) {
      cursor.current.style.display = 'none';
    }

    if (cursorDollar.current) {
      cursorDollar.current.style.display = 'none';
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div
        style={{
          marginLeft: '50px',
          height: '30px',
          borderBottom: 'solid 1px #ccc',
          backgroundColor: '#eee',
          position: 'relative',
        }}
      >
        {thresholds.map((a, i) => {
          const pos = a.activeFrom * ratio;
          console.log(pos, a.activeFrom, ratio);
          return (
            <div
              style={{
                position: 'absolute',
                backgroundColor: '#333',
                padding: '5px',
                borderRadius: '3px',
                color: 'white',
                bottom: 0,
                left: `${
                  ratio *
                  (has_negative
                    ? Math.abs(min_spend) + a.activeFrom
                    : a.activeFrom)
                }%`,
              }}
            >{`T${i + 1}: ${formatDollars(a.activeFrom)}`}</div>
          );
        })}
        <div
          ref={cursorDollar}
          style={{
            position: 'absolute',
            backgroundColor: '#007dba',
            padding: '5px',
            borderRadius: '3px',
            color: 'white',
            bottom: 0,
            left: 0,
          }}
        >{`$0`}</div>
      </div>
      <div style={{ flexGrow: 1, display: 'flex' }}>
        <div style={{ backgroundColor: '#eee', width: '50px' }}>
          {events.map((_, i) => (
            <div
              style={{
                borderTop: 'solid 1px #ddd',
                height: '40px',
                lineHeight: '40px',
                textAlign: 'center',
              }}
            >
              {i}
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            height: '100%',
            cursor: 'crosshair',
            flexGrow: 1,
            borderLeft: 'solid 1px #ccc',
          }}
          onMouseMove={move}
          onMouseEnter={enter}
          onMouseLeave={leave}
        >
          <div
            ref={cursor}
            style={{
              position: 'absolute',
              top: 0,
              zIndex: 1,
              left: 0,
              borderLeft: 'dashed 1px #007dba',
              display: 'none',
              // backgroundColor: "blue",
              height: '100%',
            }}
          ></div>
          {events.map((e, i) => (
            <div
              style={{
                position: 'relative',
                height: '40px',
                padding: '5px 0',
                borderTop: i > 0 ? 'solid 1px #eee' : 'none',
              }}
            >
              {(displayMode === 'cs' ? e.csSegments : e.ecsSegments).map(
                (s) => (
                  <div
                    style={{
                      position: 'absolute',
                      borderRadius: '15px',
                      top: '5px',
                      left: `${
                        ratio *
                        (s.start + (has_negative ? Math.abs(min_spend) : 0))
                      }%`,
                      height: '30px',
                      width: `${ratio * Math.abs(s.value)}%`,
                      backgroundColor: getBackgroundColor(e.event.type),
                    }}
                  ></div>
                )
              )}
            </div>
          ))}
          {utilized_thresholds.map((a) => (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: `${
                  ratio *
                  (has_negative
                    ? Math.abs(min_spend) + a.activeFrom
                    : a.activeFrom)
                }%`,
                borderLeft: 'dashed 1px black',
                // backgroundColor: "blue",
                height: '100%',
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
