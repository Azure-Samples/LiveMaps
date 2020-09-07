import { MarkerData } from './mapData';

export interface WarningData extends MarkerData {}

export interface WarningsByLayers {
  [layerId: string]: WarningData[] | undefined,
}

export interface WarningsByRooms {
  [roomName: string]: WarningsByLayers | undefined;
}

export interface WarningsByLocation {
  [locationId: string]: WarningsByRooms | undefined;
}