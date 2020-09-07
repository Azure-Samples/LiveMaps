import { MapPosition } from './mapData';

export enum LocationType {
  Global = 'global',
  Region = 'region',
  Campus = 'campus',
  Building = 'building',
  Floor = 'floor',
}

interface LocationConfig {
  buildingId?: string;
  facilityId?: string;
  tilesetId?: string;
  stateSets?: {
    stateSetName: string;
    stateSetId: string;
  }[];
}

export interface LocationData extends MapPosition {
  id: string;
  name: string;
  parent?: LocationData;
  type: LocationType;
  area: number;
  items?: string[];
  ordinalNumber?: number;
  config?: LocationConfig;
}

export interface RawLocationData extends Omit<LocationData, "parent"> {
  parentId?: string;
}

export type AllLocationsData = { [id: string]: LocationData | undefined };
export type RawLocationsData = { [id: string]: RawLocationData | undefined };

export const DEFAULT_LOCATION = {
  id: "global",
  name: "Global",
  type: LocationType.Global,
  area: 45058050.3,
  latitude: 50.104882,
  longitude: 32.66734,
};
