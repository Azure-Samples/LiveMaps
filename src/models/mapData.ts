import { array, ArraySchema } from 'yup';

import { strictNumber } from '../utils/validationUtils';

export interface MapPosition {
  longitude: number;
  latitude: number;
}

export type Polygon = [number, number][];

const positionSchema: ArraySchema<number> = array().of(strictNumber).min(2).max(2).defined().nullable(false);
export const polygonSchema: ArraySchema<number[]> = array().of(positionSchema).defined().nullable(false).min(3);

export interface MarkerData {
  title?: string;
  description?: string;
  position?: MapPosition;
  url?: string;
  roomName?: string;
}

export interface TrackerData {
  id: string;
  name: string;
  position: MapPosition;
}

export interface MapObject {
  polygon?: Polygon;
}