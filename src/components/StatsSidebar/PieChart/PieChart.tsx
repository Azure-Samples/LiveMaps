import './PieChart.scss';

import React from 'react';
import { Cell, Customized, Pie, PieChart as RechartPie } from 'recharts';

import { LegendItem } from './LegendItem';
import { getChartColorByIndex } from '../../../utils/colorUtils';

const RADIAN = Math.PI / 180;

interface PieChartProps {
  data: {
    name: string,
    value: number,
  }[]
}

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      alignmentBaseline="central"
      fontSize="16px"
    >
      {`${(percent * 100).toFixed(0)} %`}
    </text>
  );
};

const renderCell = (entry: any, index: number) => {
  return (
    <Cell
      key={`cell-${index}`}
      fill={getChartColorByIndex(index)}
    />
  );
};

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const totalValue: number = data.reduce((accum, { value }) => accum + value, 0);

  const Total = (props: any) => {
    const { width, height } = props;
    return (
      <text y={height / 2} textAnchor="middle" fill="black" alignmentBaseline="central">
        <tspan x={width / 2} fontSize="16px">{totalValue}</tspan>
        <tspan x={width / 2} fontSize="10px" dy="15">Total</tspan>
      </text>
    );
  }

  const legendItems = data.map(({ name, value }, idx) => {
    return {
      key: idx,
      name,
      value,
      color: getChartColorByIndex(idx)
    }
  })

  return (
    <div>
      <div className="piechart-legend">
        {legendItems.map(item => <LegendItem {...item} />)}
      </div>
      <RechartPie width={400} height={300}>
        <Pie
          data={data}
          dataKey="value"
          startAngle={450}
          endAngle={90}
          innerRadius={45}
          outerRadius={105}
          label={renderLabel}
          labelLine={false}
          isAnimationActive={false}
        >
          {data.map(renderCell)}
        </Pie>
        <Customized component={Total} />
      </RechartPie>
    </div>
  );
};

