import './SliderChart.scss';

import React from 'react';
import { Bar, BarChart as BarChartRecharts, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export interface SliderChartProps {
  value: number;
  unit?: string;
  minValue: number;
  maxValue: number;
  color: string;
}

const BAR_WIDTH = 14;
const CHART_HEIGHT = 50;

export const SliderChart: React.FC<SliderChartProps> = (props) => {
  return (
    <div className="slider-chart">
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChartRecharts data={[props]} layout="vertical">
            <YAxis type="category" hide={true} />

            <XAxis type="number" hide={true} domain={[props.minValue, props.maxValue]} />

            <Bar
              dataKey="value"
              fill={props.color}
              maxBarSize={BAR_WIDTH}
              background={{ fill: '#EFEFEF' }}
            />
          </BarChartRecharts>
        </ResponsiveContainer>
      </div>

      <span className="label">
        {`${props.value} ${props.unit}`}
      </span>
    </div>
  );
};
