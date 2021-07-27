import React, { CSSProperties, useState } from 'react';
import { Menu } from './Menu';
import { useRewardModel } from './reward-model';
import { Table } from './Table';
import { Viz } from './Viz';

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  height: '100%',
  width: '100%',
};

const asideStyle: CSSProperties = {
  height: '100%',
  width: '300px',
  backgroundColor: '#eee',
  borderRight: 'solid 1px #ccc',
};

const mainStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: `calc(100% - 300px)`,
};

const displayStyle: CSSProperties = {
  flexGrow: 1,
};

const tableStyle: CSSProperties = {
  borderBottom: 'solid 1px #ccc',
  padding: '1rem',
  height: '500px',
};

export function AppShell() {
  const model = useRewardModel();

  const [displayMode, setDisplayMode] = useState<'cs' | 'ecs'>('cs');

  return (
    <div style={containerStyle}>
      <aside style={asideStyle}>
        <Menu
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          selectedCard={model.selectedCard}
          setSelectedCard={model.setSelectedCard}
          taxRate={model.taxRate}
          setTaxRate={model.setTaxRate}
          startingPoints={model.startingPoints}
          setStartingPoints={model.setStartingPoints}
          thresholds={model.thresholds}
          updateThreshold={model.updateThreshold}
          addThreshold={model.addThreshold}
          removeThreshold={model.removeThreshold}
          setBaseMultiplier={model.setBaseMultiplier}
          addEvent={model.addEvent}
        />
      </aside>
      <main style={mainStyle}>
        <div style={tableStyle}>
          <Table
            removeEvent={model.removeEvent}
            values={model.values}
            thresholds={model.thresholds}
          />
        </div>
        <div style={displayStyle}>
          <Viz
            events={model.values}
            thresholds={model.thresholds}
            displayMode={displayMode}
          />
        </div>
      </main>
    </div>
  );
}
