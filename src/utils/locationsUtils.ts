import { AllLocationsData, LocationData, LocationType, RawLocationsData } from '../models/locationsData';

export const INVALID_FLOOR_NUMBER: number = -1;

export const isLocationsDataValid = (data: any): data is RawLocationsData => true;

const zoomByLocationType: { [type: string]: number } = {
  [LocationType.Global]: 0,
  [LocationType.Region]: 1.9,
  [LocationType.Campus]: 13,
  [LocationType.Building]: 18.5,
  [LocationType.Floor]: 18.5,
}

export const DEFAULT_ZOOM: number = zoomByLocationType[LocationType.Global];

export const getZoomByLocationType = (type: LocationType) => {
  return zoomByLocationType[type] ?? DEFAULT_ZOOM;
}

const maxDistanceByLocationType: { [type: string]: number } = {
  [LocationType.Global]: 100000000,
  [LocationType.Region]: 4000000,
  [LocationType.Campus]: 2000,
  [LocationType.Building]: 70,
  [LocationType.Floor]: 70,
}

export const DEFAULT_MAX_DISTANCE: number = maxDistanceByLocationType[LocationType.Floor];

export const getMaxDistanceByLocationType = (type: LocationType) => {
  return maxDistanceByLocationType[type] ?? DEFAULT_MAX_DISTANCE;
}

export const hasFloors = (locationId: string, allLocationsData: AllLocationsData) => {
  if (!locationId || !allLocationsData) {
    return false;
  }

  const locationItemsId: string[] = allLocationsData[locationId]?.items ?? [];

  return locationItemsId.some((itemId: string) => {
    return !!itemId && allLocationsData[itemId]?.type === LocationType.Floor;
  })
}

const getLocationOrdinalNumber = (locationData: LocationData): number => {
  return locationData.ordinalNumber ?? locationData.parent?.items?.indexOf(locationData.id) ?? 0;
}

const deleteLocation = (locationId: string, allLocationsData: RawLocationsData) => {
  const locationData = allLocationsData[locationId];

  if (locationData?.parentId) {
    let parentLocationData: LocationData | undefined = allLocationsData[locationData.parentId];

    if (parentLocationData?.items?.length) {
      const index: number = parentLocationData.items.indexOf(locationId);

      if (index !== -1) {
        parentLocationData.items.splice(index, 1);
      }
    }
  }

  delete allLocationsData[locationId];
}

export const prepareLocationData = (locationsData: RawLocationsData): AllLocationsData => {
  for (const locationId in locationsData) {
    let locationData = locationsData[locationId]!;

    if (!locationData.name || !locationData.id) {
      deleteLocation(locationId, locationsData);
      continue;
    }

    if (locationData.parentId) {
      (locationData as LocationData).parent = locationsData[locationData.parentId];
      delete locationData.parentId;
    }

    if (locationData.type === LocationType.Floor) {
      locationData.ordinalNumber = getLocationOrdinalNumber(locationData);
    }
  }

  return locationsData;
}

export const getFullLocationName = (locationId: string, allLocationsData: AllLocationsData) => {
  const essentialLocationTypes = [LocationType.Global, LocationType.Region, LocationType.Campus];

  let location: LocationData | undefined = allLocationsData[locationId];
  let fullName: string = location?.name ?? locationId;

  while (location && !essentialLocationTypes.includes(location.type)) {
    location = location.parent;

    if (location) {
      fullName = `${location.name} > ${fullName}`;
    }
  }

  return fullName;
}

export const getLocationPath = (location: LocationData | undefined) => {
  return location?.id ? "/" + location?.id : "/";
}

export const getLocationByPath = (path: string, allLocations: AllLocationsData): LocationData | undefined => {
  while (path.startsWith("/")) {
    // Strip leading slash
    path = path.substr(1);
  }

  while (path.endsWith("/")) {
    // Strip trailing slash
    path = path.slice(0, -1);
  }

  const location = allLocations[path];
  if (!location) {
    return;
  }

  if (
    location.type === LocationType.Building
    && location.items?.length
    && location.items[0]
    && allLocations[location.items[0]]
  ) {
    // Return floor location if the last segment points to building
    return allLocations[location.items[0]];
  }

  return location;
};

export const getLocationSegments = (location: LocationData): LocationData[] => {
  let loc = location;
  const result: LocationData[] = [location];
  while (loc.parent) {
    loc = loc.parent;
    result.unshift(loc);
  }

  return result;
};

export const getBuildingId = (location?: LocationData) => {
  let buildingId: string | undefined;

  if (location?.type === LocationType.Floor) {
    buildingId = location.parent?.id;
  } else if (location?.type === LocationType.Building) {
    buildingId = location.id;
  }

  return buildingId;
};

export const getLocationFacilityId = (location: LocationData): string | undefined => {
  let facilityId = location.config?.facilityId;
  if (facilityId === undefined && location.type === LocationType.Floor) {
    facilityId = location.parent?.config?.facilityId;
  }

  return facilityId;
};

export const getLocationTilesetId = (location: LocationData): string | undefined => {
  let tilesetId = location.config?.tilesetId;
  if (tilesetId === undefined && location.type === LocationType.Floor) {
    tilesetId = location.parent?.config?.tilesetId;
  }

  return tilesetId;
};
