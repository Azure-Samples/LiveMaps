import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { History } from 'history';

import { AppThunk, RootState } from '../store/store';
import {
  AllLocationsData,
  DEFAULT_LOCATION,
  LocationData,
  LocationType,
  RawLocationsData,
} from '../models/locationsData';
import {
  getBuildingId,
  getLocationByPath,
  getLocationPath,
  getLocationSegments,
  isLocationsDataValid,
  prepareLocationData,
} from '../utils/locationsUtils';
import { mapService } from '../services/mapService';
import { fetchSidebar } from './sidebar';
import { fetchSensors } from './sensors';
import { fetchWarningsInfo } from './warnings';
import { resetCurrentIndoorLocation } from './indoor';
import { favoritesService } from '../services/favoritesService';
import { setLayersVisibility } from './layersData';
import { fetchRoomsInfo } from './rooms';
import { sitemapUrl } from '../config';

interface CurrentLocation {
  location: LocationData;
  segments: LocationData[];
  path: string;
}

export interface LocationState {
  current: CurrentLocation;
  isLoaded: boolean;
  allLocations: AllLocationsData;
};

const initialState: LocationState = {
  allLocations: {},
  isLoaded: false,
  current: {
    location: DEFAULT_LOCATION,
    segments: [],
    path: "/",
  },
};

type ChangeLocationPayload = CurrentLocation;

export const locationDataSlice = createSlice({
  name: 'locationData',
  initialState,
  reducers: {
    changeLocation: (state: LocationState, action: PayloadAction<ChangeLocationPayload>) => {
      return {
        ...state,
        current: action.payload,
      };
    },
    setLocationsData: (state: LocationState, action: PayloadAction<any>) => {
      const rawLocations: RawLocationsData = isLocationsDataValid(action.payload) ? action.payload : {};
      const allLocations = prepareLocationData(rawLocations);

      return {
        ...state,
        allLocations,
        isLoaded: true,
      };
    },
  },
});

const {
  setLocationsData,
} = locationDataSlice.actions;

export const changeLocation = (locationId: string, history: History): AppThunk => (dispatch, getState) => {
  const { locationData: { allLocations } } = getState();
  const location = allLocations[locationId] ?? DEFAULT_LOCATION;

  if (location) {
    dispatch(fetchSidebar(location));
  }

  const path = getLocationPath(location);
  history.push(path);
}

export const updateCurrentLocation = (path: string, history: History ): AppThunk => (dispatch, getState) => {
  const {locationData: {
    allLocations,
    current: { path: currentLocationPath, location: currentLocation }
  }} = getState();

  const location = getLocationByPath(path, allLocations) ?? DEFAULT_LOCATION;
  const normalizedPath = getLocationPath(location);
  if (normalizedPath !== path) {
    history.replace(normalizedPath);
    return;
  }

  if (normalizedPath === currentLocationPath) {
    return;
  }

  dispatch(resetCurrentIndoorLocation());

  dispatch(locationDataSlice.actions.changeLocation({
    location,
    segments: getLocationSegments(location),
    path: normalizedPath,
  }));

  mapService.changeLocation(location);

  const favoriteData = favoritesService.getDataById(location.id);
  if (favoriteData?.layersVisibility) {
    dispatch(setLayersVisibility(favoriteData.layersVisibility));
  }

  let buildingId: string | undefined = getBuildingId(currentLocation);
  let newBuildingId: string | undefined = getBuildingId(location);

  if (buildingId !== newBuildingId) {
    dispatch(fetchRoomsInfo(newBuildingId));
  }

  dispatch(fetchWarningsInfo());

  if (location.type === LocationType.Floor) {
    dispatch(fetchSensors(location.id));
  }
}

export const selectCurrentLocationData = (state: RootState) => state.locationData.current.location;
export const selectCurrentLocationId = (state: RootState) => state.locationData.current.location?.id;
export const selectCurrentLocationSegments = (state: RootState) => state.locationData.current.segments;
export const selectLocationsData = (state: RootState) => state.locationData.allLocations;
export const selectLocationsDataLoaded = (state: RootState) => state.locationData.isLoaded;

export default locationDataSlice.reducer;

const fetchLocationsData = async () => {
  try {
    const response: Response = await fetch(sitemapUrl);

    if (response.ok) {
      const json = await response.json();
      return json ?? {};
    } else {
      throw new Error();
    }
  } catch {
    console.error("Failed to get current user info");
    return {};
  }
}

export const fetchLocationsInfo = (path: string, history: History): AppThunk => async (dispatch, getState) => {
  let data = await fetchLocationsData();
  dispatch(setLocationsData(data));

  dispatch(updateCurrentLocation(path, history));

  const current = getState().locationData.current;

  if (current.location) {
    dispatch(fetchSidebar(current.location));
  }
};
