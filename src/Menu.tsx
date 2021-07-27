import React, { useState } from 'react';
import { RewardEvent } from './reward-model';
import { BASE_THRESHOLD_ID, Threshold } from './thresholds';
import { v4 as uuid } from 'uuid';
import {
  CardConfiguration,
  CARD_PRESETS,
  CUSTOM_CARD_NAME,
} from './card-configuration';

interface MenuProps {
  displayMode: 'cs' | 'ecs';
  setDisplayMode: (v: 'cs' | 'ecs') => void;
  selectedCard: CardConfiguration;
  setSelectedCard: (v: CardConfiguration) => void;
  taxRate: number | '';
  setTaxRate: (v: number | '') => void;
  thresholds: Threshold[];
  removeThreshold: (t: Threshold) => void;
  addThreshold: (t: Threshold) => void;
  updateThreshold: (t: Threshold) => void;
  setBaseMultiplier: (v: number) => void;
  addEvent: (e: RewardEvent) => void;
  startingPoints: number | '';
  setStartingPoints: (v: number | '') => void;
}

export function Menu({
  displayMode,
  setDisplayMode,
  selectedCard,
  setSelectedCard,
  taxRate,
  setTaxRate,
  thresholds,
  removeThreshold,
  addThreshold,
  updateThreshold,
  setBaseMultiplier,
  addEvent,
  startingPoints,
  setStartingPoints,
}: MenuProps) {
  const [spendValue, setSpendValue] = useState<'' | number>(0);
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

  function makeEvent(type: RewardEvent['type']) {
    return () => {
      addEvent({
        id: uuid(),
        value: Number(spendValue) * 100,
        type,
      });

      setSpendValue(0);
    };
  }

  function changeCard(ev: React.ChangeEvent<HTMLSelectElement>) {
    const card = CARD_PRESETS.find((a) => a.name === ev.target.value);

    if (!card) {
      return console.error('Missing card somehow?');
    }

    setSelectedCard(card);
  }

  const is_custom = selectedCard.name === CUSTOM_CARD_NAME;

  return (
    <>
      <section>
        <div className="field-label">Select Card</div>
        <div>
          <select value={selectedCard.name} onChange={changeCard}>
            {CARD_PRESETS.map((a) => (
              <option value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="field-label">Opening Balance (points)</div>
        <div>
          <input
            type="number"
            value={
              startingPoints === '' ? startingPoints : startingPoints / 100
            }
            onChange={(e) =>
              setStartingPoints(
                e.target.value === ''
                  ? e.target.value
                  : Number(e.target.value) * 100
              )
            }
          />
        </div>
        {is_custom && (
          <>
            <div className="field-label">Tax Rate</div>
            <div>
              <input
                type="number"
                value={taxRate}
                step="0.5"
                onChange={(e) =>
                  setTaxRate(
                    e.target.value === ''
                      ? e.target.value
                      : Number(e.target.value)
                  )
                }
              />
            </div>
          </>
        )}
      </section>
      {is_custom && (
        <section>
          <table className="tier-table">
            <thead>
              <tr style={{ fontWeight: 'bold' }}>
                <th style={{ width: '50px' }}>Tier</th>
                <th>From</th>
                <th>Value</th>
                <th style={{ width: '25px' }}></th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map((t, i, a) => (
                <tr>
                  <td style={{ width: '25px' }}>{`T${i + 1}`}</td>
                  <td>
                    {t.id === BASE_THRESHOLD_ID ? (
                      t.activeFrom
                    ) : (
                      <input
                        step="50"
                        min={i === 0 ? 0 : a[i - 1].activeFrom / 100 + 50}
                        style={{ width: '100%' }}
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
                      style={{ width: '70px' }}
                      type="number"
                      value={t.multiplier}
                      onChange={(e) =>
                        t.id === 'base'
                          ? setBaseMultiplier(Number(e.target.value))
                          : updateThreshold({
                              ...t,
                              multiplier: Number(e.target.value),
                            })
                      }
                    />
                  </td>
                  <td style={{ width: '25px' }}>
                    {t.id !== 'base' && (
                      <button onClick={() => removeThreshold(t)}>X</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <button
              style={{ width: '100%', padding: '0.5rem', cursor: 'pointer' }}
              onClick={createThreshold}
            >
              {'New Tier'}
            </button>
          </div>
        </section>
      )}
      <section>
        <div className="field-label">Events</div>
        <div>
          <input
            type="number"
            value={spendValue}
            onChange={(e) => {
              console.log(e.target.value);
              setSpendValue(
                e.target.value === '' ? e.target.value : Number(e.target.value)
              );
            }}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button
              style={{ width: '50%', padding: '0.5rem', cursor: 'pointer' }}
              disabled={!spendValue}
              onClick={makeEvent('spend')}
            >
              {'Spend'}
            </button>
            <button
              style={{ width: '50%', padding: '0.5rem', cursor: 'pointer' }}
              disabled={!spendValue}
              onClick={makeEvent('refund')}
            >
              {'Refund'}
            </button>
          </div>
          <div>
            <button
              style={{ width: '50%', padding: '0.5rem', cursor: 'pointer' }}
              disabled={!spendValue}
              onClick={makeEvent('tax-spend')}
            >
              {'Tax Spend'}
            </button>
            <button
              style={{ width: '50%', padding: '0.5rem', cursor: 'pointer' }}
              disabled={!spendValue}
              onClick={makeEvent('tax-refund')}
            >
              {'Tax Refund'}
            </button>
          </div>
        </div>
      </section>
      {/* TODO: Enable display mode
        <section>
          <div className="field-label">Graph Display Mode</div>
          <div>
            <button
              style={{
                width: '50%',
                padding: '0.5rem',
                cursor: displayMode === 'cs' ? '' : 'pointer',
                backgroundColor: displayMode === 'cs' ? '#007dba' : 'white',
                border:
                  displayMode === 'cs'
                    ? 'solid 1px transparent'
                    : 'solid 1px #aaa',
                borderRadius: '3px',
                color: displayMode === 'cs' ? 'white' : undefined,
              }}
              disabled={displayMode === 'cs'}
              onClick={() => setDisplayMode('cs')}
            >
              {'CS'}
            </button>
            <button
              style={{
                width: '50%',
                padding: '0.5rem',
                cursor: displayMode === 'ecs' ? '' : 'pointer',
                backgroundColor: displayMode === 'ecs' ? '#007dba' : 'white',
                border:
                  displayMode === 'ecs'
                    ? 'solid 1px transparent'
                    : 'solid 1px #aaa',
                borderRadius: '3px',
                color: displayMode === 'ecs' ? 'white' : undefined,
              }}
              disabled={displayMode === 'ecs'}
              onClick={() => setDisplayMode('ecs')}
            >
              {'ECS'}
            </button>
          </div>
        </section>
            */}
    </>
  );
}
