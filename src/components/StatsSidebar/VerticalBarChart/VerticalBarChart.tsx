import React from 'react';
import { Bar, BarChart as BarChartRecharts, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface VerticalBarChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const MIN_BAR_WIDTH = 10;
const MAX_BAR_WIDTH = 30;
const MIN_BAR_GAP = 10;
const MIN_CHART_HEIGHT = 300;
const BAR_COLOR = '#0078D4';
const X_AXIS_HEIGHT = 20;

export const VerticalBarChart: React.FC<VerticalBarChartProps> = ({ data }) => {
  if (!data.length) {
    return null;
  }

  const chartHeight: number = Math.max(
    (MIN_BAR_WIDTH + MIN_BAR_GAP) * data.length + X_AXIS_HEIGHT,
    MIN_CHART_HEIGHT
  );

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChartRecharts data={data} layout="vertical" margin={{ top: 16, right: 32 }} >
        <CartesianGrid horizontal={false}/>
        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} interval={0} />
        <XAxis type="number" axisLine={false} tickLine={false}/>
        <Tooltip />
        <Bar dataKey="value" fill={BAR_COLOR} maxBarSize={MAX_BAR_WIDTH} />
      </BarChartRecharts>
    </ResponsiveContainer>
  );
};
