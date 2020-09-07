import { object, string } from 'yup';

import { Polygon, polygonSchema } from './mapData';
import { notEmptyString } from '../utils/validationUtils';

export interface RoomData {
  name?: string;
  type: string;
  unitId: string;
  polygon: Polygon;
}

export const RoomDataSchema = object().shape({
  name: string(),
  type: notEmptyString,
  unitId: notEmptyString,
  polygon: polygonSchema,
}).defined().nullable(false);

export interface RoomsByFloorId {
  [floorId: string]: {
    [roomId: string]: RoomData | undefined;
  } | undefined;
}