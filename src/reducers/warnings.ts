import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AppThunk, RootState } from '../store/store';
import { WarningData, WarningsByLayers, WarningsByLocation, WarningsByRooms } from '../models/warningsData';
import { mapService } from '../services/mapService';
import { LocationType } from '../models/locationsData';
import { LoadingState } from '../models/loadingState';
import { warningsDataUrl } from '../config';

export const isWarningsDataValid = (data: any): data is WarningsByLocation => {
  try {
    for (const locationId in data) {
      const warningsByRooms: WarningsByRooms = data[locationId];

      for (const roomId in warningsByRooms) {
        const warningsByLayers: WarningsByLayers | undefined = warningsByRooms[roomId];

        for (const layerId in warningsByLayers) {
          const warnings: WarningData[] | undefined = warningsByLayers[layerId];
          const isValid: boolean = !!warnings && warnings.every((warning: WarningData) => (
            (!warning.title || typeof warning.title === 'string')
            && (!warning.description || typeof warning.description === 'string')
            && (!warning.url || typeof warning.url === 'string')
            && (!warning.position || (
              typeof warning.position.latitude === 'number' && typeof warning.position.longitude === 'number')
            )
          ));

          if (!isValid) {
            return false;
          }
        }
      }
    }
    return true;
  } catch {
    return false;
  }
};

export interface WarningsState {
  data: WarningsByLocation;
  loadingState: LoadingState;
};

const initialState: WarningsState = {
  data: {},
  loadingState: LoadingState.Loading,
};

interface SetWarningsPayload {
  data: WarningsByLocation;
  loadingState: LoadingState;
}

export const warningsSlice = createSlice({
  name: 'warnings',
  initialState,
  reducers: {
    setWarnings: (state: WarningsState, action: PayloadAction<SetWarningsPayload>) => {
      const { data, loadingState } = action.payload;

      return {
        ...state,
        data,
        loadingState,
      };
    },
  },
});

const {
  setWarnings,
} = warningsSlice.actions;

export const selectWarningsLoadingState = (state: RootState) => state.warnings.loadingState;

export const selectWarningsData = (state: RootState) => state.warnings.data;

export default warningsSlice.reducer;

const fetchWarningsData = async (locationId: string) => {
  const url = warningsDataUrl.replace("{locationPath}", locationId);
  const response: Response = await fetch(url);

  if (response.ok) {
    const json = await response.json();
    return json ?? {};
  } else {
    throw new Error();
  }
}

export const fetchWarningsInfo = (): AppThunk => async (dispatch, getState) => {
  const { locationData: { current: { location: currentLocation } } } = getState();
  mapService.updateWarningsData({});

  let locationId: string = '';

  if (currentLocation.type === LocationType.Building) {
    locationId = currentLocation.id;
  } else if (currentLocation.type === LocationType.Floor && currentLocation.parent?.id) {
    const parentLocation = currentLocation.parent;

    if (parentLocation) {
      locationId = parentLocation.id;
    }
  }

  if (!locationId) {
    dispatch(setWarnings({ data: {}, loadingState: LoadingState.Ready }));
    return;
  }

  dispatch(setWarnings({ data: {}, loadingState: LoadingState.Loading }));

  try {
    const warningsByLocation: any = await fetchWarningsData(locationId);

    if (isWarningsDataValid(warningsByLocation)) {
      dispatch(setWarnings({ data: warningsByLocation, loadingState: LoadingState.Ready }));
      mapService.updateWarningsData(warningsByLocation);
    } else {
      throw new Error('Warnings data is not valid');
    }
  } catch (e) {
    console.error(e.message ?? 'Failed to get warnings info');
    dispatch(setWarnings({ data: {}, loadingState: LoadingState.Error }));
  };
};
