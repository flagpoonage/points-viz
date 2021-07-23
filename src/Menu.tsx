import React, { useState } from "react";
import { formatCurrency, RewardEvent } from "./reward-model";
import { Threshold } from "./thresholds";
import { v4 as uuid } from "uuid";

interface MenuProps {
  taxRate: number | "";
  setTaxRate: (v: number | "") => void;
  thresholds: Threshold[];
  removeThreshold: (t: Threshold) => void;
  addThreshold: (t: Threshold) => void;
  updateThreshold: (t: Threshold) => void;
  setBaseMultiplier: (v: number) => void;
  addEvent: (e: RewardEvent) => void;
  openingBalance: number | "";
  setOpeningBalance: (v: number | "") => void;
  startingPoints: number | "";
  setStartingPoints: (v: number | "") => void;
  applyNegativePoints: boolean,
  setApplyNegativePoints: (v: boolean) => void;
}

export function Menu({
  taxRate,
  setTaxRate,
  thresholds,
  removeThreshold,
  addThreshold,
  updateThreshold,
  setBaseMultiplier,
  addEvent,
  openingBalance,
  startingPoints,
  setOpeningBalance,
  setStartingPoints,
  applyNegativePoints,
  setApplyNegativePoints
}: MenuProps) {
  const [spendValue, setSpendValue] = useState<"" | number>(0);
  function createThreshold() {
    const current_max = thresholds.reduce(
      (acc, val) => (val.activeFrom > acc ? val.activeFrom : acc),
      0
    );

    addThreshold({
      id: uuid(),
      activeFrom: current_max + 100000,
      multiplier: 1,
    });
  }

  function spend() {
    addEvent({
      id: uuid(),
      value: Number(spendValue) * 100,
      type: "spend",
    });

    setSpendValue(0);
  }

  function refund() {
    addEvent({
      id: uuid(),
      value: Number(spendValue) * 100,
      type: "refund",
    });

    setSpendValue(0);
  }

  function taxSpend() {
    addEvent({
      id: uuid(),
      value: Number(spendValue) * 100,
      type: "tax-spend",
    });

    setSpendValue(0);
  }

  function taxRefund() {
    addEvent({
      id: uuid(),
      value: Number(spendValue) * 100,
      type: "tax-refund",
    });

    setSpendValue(0);
  }

  return (
    <>
      <div>Opening Balance ($)</div>
      <div>
        <input
          type="number"
          value={openingBalance === "" ? openingBalance : openingBalance / 100}
          onChange={(e) =>
            setOpeningBalance(
              e.target.value === ""
                ? e.target.value
                : Number(e.target.value) * 100
            )
          }
        />
      </div>
      <div>Opening Balance (points)</div>
      <div>
        <input
          type="number"
          value={startingPoints === "" ? startingPoints : startingPoints / 100}
          onChange={(e) =>
            setStartingPoints(
              e.target.value === ""
                ? e.target.value
                : Number(e.target.value) * 100
            )
          }
        />
      </div>
      <div>Tax Rate</div>
      <div>
        <input
          type="number"
          value={taxRate}
          step="0.5"
          onChange={(e) =>
            setTaxRate(
              e.target.value === ""
                ? e.target.value
                : Number(e.target.value)
            )
          }
        />
      </div>
      <div><input type="checkbox" checked={applyNegativePoints} onChange={e => setApplyNegativePoints(e.target.checked)} /> Apply Negative Points?</div>
      <div>Tiers</div>
      <table>
        <thead>
          <tr>
            <th>Tier</th>
            <th>From</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {thresholds.map((t, i, a) => (
            <tr>
              <td>{`T${i + 1}`}</td>
              <td>
                {t.id === "base" ? (
                  t.activeFrom
                ) : (
                  <input
                    step="50"
                    min={i === 0 ? 0 : a[i - 1].activeFrom / 100 + 50}
                    style={{ width: "80px" }}
                    type="number"
                    value={t.activeFrom / 100}
                    onChange={(e) =>
                      updateThreshold({
                        ...t,
                        activeFrom: Number(e.target.value) * 100,
                      })
                    }
                  />
                )}
              </td>
              <td>
                <input
                  step="0.5"
                  style={{ width: "80px" }}
                  type="number"
                  value={t.multiplier}
                  onChange={(e) =>
                    t.id === "base"
                      ? setBaseMultiplier(Number(e.target.value))
                      : updateThreshold({
                          ...t,
                          multiplier: Number(e.target.value),
                        })
                  }
                />
              </td>
              <td>
                {t.id !== "base" && (
                  <button onClick={() => removeThreshold(t)}>X</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={createThreshold}>{"New Threshold"}</button>
      </div>
      <div>Events</div>
      <div>
        <input
          type="number"
          value={spendValue}
          onChange={(e) => {
            console.log(e.target.value);
            setSpendValue(
              e.target.value === "" ? e.target.value : Number(e.target.value)
            );
          }}
        />
        <div>
          <button disabled={!spendValue} onClick={spend}>
            {"Spend"}
          </button>
          <button disabled={!spendValue} onClick={refund}>
            {"Refund"}
          </button>
        </div>
        <div>
          <button disabled={!spendValue} onClick={taxSpend}>
            {"Tax Spend"}
          </button>
          <button disabled={!spendValue} onClick={taxRefund}>
            {"Tax Refund"}
          </button>
        </div>
      </div>
    </>
  );
}
