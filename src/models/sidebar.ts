export interface LabelData {
  type: 'label';
  data: {
    name: string;
    value?: any;
  };
}

export interface LineChartData {
  type: 'line';
  data: {
    x: string;
    y: { [key: string]: number | undefined; };
  }[];
  colors?: { [key: string]: string | undefined; };
  names: { [key: string]: string; };
  minValue?: number | null;
  maxValue?: number | null;
}

export interface PieChartData {
  type: 'pie';
  data: {
    name: string;
    value: number;
  }[];
}

export interface BarChartData {
  type: 'bar' | 'verticalBar',
  data: {
    name: string;
    value: number;
  }[];
}

export interface SliderChartData {
  type: 'slider',
  data: [{
    value: number;
    unit?: string;
    minValue: number;
    maxValue: number;
    color: string;
  }];
}

export interface AlertData {
  type: 'alert';
  data: {
    name: string;
    url?: string;
    iconName?: string;
    iconColor?: string;
  }
}

export interface SliderControlData {
  type: 'slider_control',
  data: {
    name: string;
    value?: number;
    minValue: number;
    maxValue: number;
    disabled?: boolean;
    onSave?(newValue: number): void;
  }
}

export type SidebarItemData = BarChartData | LabelData | AlertData | PieChartData | SliderControlData | SliderChartData | LineChartData;

export interface SidebarGroup {
  id: string;
  name: string;
  collapsed?: boolean
  items: SidebarItemData[];
}

export type SidebarData = SidebarGroup[];

