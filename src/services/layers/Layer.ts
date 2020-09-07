import { Map } from 'azure-maps-control';
import { Dispatch } from '@reduxjs/toolkit';
import { indoor } from 'azure-maps-indoor';

import { LocationData } from '../../models/locationsData';

export enum LayerType {
  Floors = 'floors',
  Indoor = 'indoor',
  Markers = 'markers',
  Warnings = 'warnings',
  Weather = 'weather',
  Tracking = 'tracking'
}

export interface LayerChildItem {
  id: string;
  name: string;
  visible: boolean;
}

export interface ComponentAndProps<P = {}> {
  component: React.FC<P>;
  props: P;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  isVisible: boolean;
  initialize(map: Map, indoorManager: indoor.IndoorManager, dispatch: Dispatch<any>): void;
  setVisibility(isVisible: boolean): void;
  setLocation(location: LocationData): void;
  dispose(): void;
  onLayerVisibilityChange?(layer: Layer): void;
  getChildren?(): LayerChildItem[];
  setChildVisibility?(name: string, visible: boolean): void;
  getMapComponent?(): ComponentAndProps<any> | undefined;
}
