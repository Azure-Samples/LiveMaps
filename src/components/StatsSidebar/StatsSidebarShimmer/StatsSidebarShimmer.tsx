import React from 'react';
import { Shimmer, ShimmerElementsGroup, ShimmerElementType } from '@fluentui/react';

const IndentShimmer: React.FC<{ height: number, width?: string }> = ({ height, width }) => {
  return (
    <ShimmerElementsGroup
      width={width ?? '100%'}
      shimmerElements={[
        { type: ShimmerElementType.gap, width: '100%', height: height },
      ]}
    />
  );
};

const LabelShimmer = () => {
  const labelWidth: number = Math.random() * 20 + 30;
  const valueWidth: number = Math.random() * 10 + 5;
  const gapWidth: number = 100 - labelWidth - valueWidth;

  return (
    <div>
      <IndentShimmer height={14} />

      <ShimmerElementsGroup
        width="100%"
        flexWrap
        shimmerElements={[
          { type: ShimmerElementType.line, width: `${labelWidth}%`, height: 18 },
          { type: ShimmerElementType.gap, width: `${gapWidth}%`, height: 18 },
          { type: ShimmerElementType.line, width: `${valueWidth}%`, height: 18 },
        ]}
      />

      <IndentShimmer height={14} />
    </div>
  );
};

const GroupHeaderShimmer = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <IndentShimmer height={16} />

      <ShimmerElementsGroup
        width="100%"
        shimmerElements={[
          { type: ShimmerElementType.line, width: '100%', height: 18},
        ]}
      />

      <IndentShimmer height={16} />
    </div>
  );
};

const LegendItemShimmer = () => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', width: '24%' }}>
      <ShimmerElementsGroup
        width="100%"
        shimmerElements={[
          { type: ShimmerElementType.circle, width: 12, height: 12 },
          { type: ShimmerElementType.gap, width: 4, height: 16 },
          { type: ShimmerElementType.line, width: 'calc(100% - 16px)', height: 16 },
        ]}
      />

      <IndentShimmer height={6} />

      <ShimmerElementsGroup
        width="100%"
        shimmerElements={[
          { type: ShimmerElementType.gap, width: 16, height: 18 },
          { type: ShimmerElementType.line, width: '40%', height: 18 },
          { type: ShimmerElementType.gap, width: 'calc(60% - 16px)', height: 18 },
        ]}
      />
    </div>
  );
};

const ChartLegendShimmer = () => {
  return (
    <div style={{ display: 'flex' }}>
      <LegendItemShimmer />

      <IndentShimmer width='14%' height={40} />

      <LegendItemShimmer />

      <IndentShimmer width='14%' height={40} />

      <LegendItemShimmer />
    </div>
  );
};

const ChartShimmer = () => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <IndentShimmer height={45} />

      <ShimmerElementsGroup
        width="100%"
        flexWrap
        shimmerElements={[
          { type: ShimmerElementType.gap, width: 'calc((100% - 210px) / 2)', height: 210 },
          { type: ShimmerElementType.circle, width: '80%', height: 210 },
          { type: ShimmerElementType.gap, width: 'calc((100% - 210px) / 2)', height: 210 },
        ]}
      />

      <IndentShimmer height={45} />
    </div>
  )
}

export const StatsSidebarShimmer = React.memo(() => {
  const labels = [];

  for (let i = 0; i < 5; i++){
    labels.push(<LabelShimmer />);
  }

  return (
    <Shimmer
      width="100%"
      style={{ padding: '0 25px'}}
      customElementsGroup={
        <div>
          <GroupHeaderShimmer />
          {labels}

          <GroupHeaderShimmer />
          <ChartLegendShimmer />
          <ChartShimmer />
        </div>
      }
    />
  );
});
