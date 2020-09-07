import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as LineChartRecharts,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getChartColorByIndex } from '../../../utils/colorUtils';

export interface LineChartProps {
  data: {
    x: string;
    y: { [key: string]: number | undefined; };
  }[];
  names: { [key: string]: string; };
  minValue?: number | null;
  maxValue?: number | null;
  colors?: { [key: string]: string | undefined; };
}

export const LineChart: React.FC<LineChartProps> = ({ data, names, colors = {}, minValue, maxValue }) => {
  let domain: [number, number] | undefined;

  if (minValue != null && maxValue != null) {
    domain = [minValue, maxValue];
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChartRecharts data={data} margin={{ top: 16, right: 25, left: -16 }}>
        <CartesianGrid />
        <XAxis dataKey="x" axisLine={false} tickLine={false}/>
        <YAxis axisLine={false} tickLine={false} domain={domain} />
        <Tooltip />

        {Object.keys(names).map((key: string, index: number) => (
          <Line
            dataKey={`y.${key}`}
            name={names[key]}
            stroke={colors[key] ?? getChartColorByIndex(index)}
            connectNulls
          />
        ))}
      </LineChartRecharts>
    </ResponsiveContainer>
  );
};
