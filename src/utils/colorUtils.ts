export const CHARTS_PALETTE = [
  '#7F3C8D', '#E58606', '#096DD9', '#F8D149', '#FADB14', '#3969AC', '#E68310',
  '#CF1C90', '#29C7A1', '#D81A29', '#764E9F', '#389E0D', '#E73F74', '#4B4B8F',
  '#CC61B0', '#FF7C00', '#CC3A8E', '#0032FF', '#11A579', '#008695', '#5D69B1',
  '#8C8C8C', '#2B88D8', '#03BD5B', '#F2B701', '#F97B72', '#99C945', '#FF3700',
  '#ED645A', '#13C2C2', '#5FC41D', '#A5AA99', '#24796C', '#FFA407', '#A5AA99',
  '#EB2F96',
];

export const getChartColorByIndex = (index: number) => CHARTS_PALETTE[index % CHARTS_PALETTE.length];