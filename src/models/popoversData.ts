export enum PopoverType {
  Warning = 'warning',
}

export interface PopoverData {
  type: PopoverType;
  isVisible: boolean;
  target?: string;
  title?: string;
  description?: string;
}