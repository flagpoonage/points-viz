import React, { CSSProperties } from 'react';
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
  backgroundColor: '#f5f5f5',
};

const mainStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: `calc(100% - 300px)`,
};

const displayStyle: CSSProperties = {
  height: '50%',
};

const tableStyle: CSSProperties = {
  padding: '1rem',
  flexGrow: 1,
};

export function AppShell() {
  const model = useRewardModel();

  return (
    <div style={containerStyle}>
      <aside style={asideStyle}>
        <Menu
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
        <div style={displayStyle}>
          <Viz events={model.values} thresholds={model.thresholds} />
        </div>
        <div style={tableStyle}>
          <Table
            removeEvent={model.removeEvent}
            values={model.values}
            thresholds={model.thresholds}
          />
        </div>
      </main>
    </div>
  );
}
