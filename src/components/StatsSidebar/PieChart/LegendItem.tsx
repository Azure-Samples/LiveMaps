import React from "react";
import { Icon, Text } from "@fluentui/react";

import "./LegendItem.scss";

interface LegendItemProps {
  name: string;
  value: string | number;
  color: string;
}

export const LegendItem: React.FC<LegendItemProps> = ({ name, value, color }) => {
  return (
    <div className="piechart-legend-item">
      <Icon iconName="CircleFill" style={{ color }} className="piechart-data-icon" />
      <div className="piechart-data-text">
        <Text>{name}</Text>
        <br />
        { value && <Text className="piechart-data-value">{value}</Text> }
      </div>
    </div>
  );
};
