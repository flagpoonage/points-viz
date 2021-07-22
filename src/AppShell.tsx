import React, { CSSProperties } from "react";
import { Menu } from "./Menu";
import { useRewardModel } from "./reward-model";
import { Table } from "./Table";
import { Viz } from "./Viz";

const containerStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  height: "100%",
  width: "100%",
};

const asideStyle: CSSProperties = {
  backgroundColor: "#00ff0022",
  height: "100%",
  width: "300px",
};

const mainStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: `calc(100% - 300px)`,
};

const displayStyle: CSSProperties = {
  height: "50%",
  backgroundColor: "#0000ff22",
};

const tableStyle: CSSProperties = {
  backgroundColor: "#ff000022",
  height: "50%",
};

export function AppShell() {
  const model = useRewardModel(1, 0);

  return (
    <div style={containerStyle}>
      <aside style={asideStyle}>
        <Menu
          openingBalance={model.startingAccumulation}
          setOpeningBalance={model.setStartingAccumulation}
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
