import React from 'react';
import { Bar, BarChart as BarChartRecharts, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface BarChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const MAX_BAR_WIDTH = 30;
const BAR_COLOR = '#0078D4';

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (!data.length) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChartRecharts data={data} margin={{ top: 16, right: 25 }}>
        <CartesianGrid vertical={false}/>
        <XAxis dataKey="name" axisLine={false} tickLine={false}/>
        <YAxis axisLine={false} tickLine={false}/>
        <Tooltip />
        <Bar dataKey="value" fill={BAR_COLOR} maxBarSize={MAX_BAR_WIDTH}/>
      </BarChartRecharts>
    </ResponsiveContainer>
  );
};
