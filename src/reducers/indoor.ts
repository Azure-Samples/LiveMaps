import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, RootState } from '../store/store';
import { subscriptionKey } from '../config';

import { LocationData, LocationType } from "../models/locationsData";

interface LocationState {
  value?: number;
  loaded: boolean;
}

export interface LocationStates {
  [name: string]: LocationState | undefined;
}

export interface IndoorLocation {
  id: string;
  name: string;
  type: string;
  floor?: string;
}

export interface IndoorState {
  currentLocation?: IndoorLocation;
  currentStates: LocationStates;
};

const initialState: IndoorState = {
  currentStates: {},
};

export const indoorSlice = createSlice({
  name: 'indoor',
  initialState,
  reducers: {
    setCurrentIndoorLocation: (state: IndoorState, action: PayloadAction<IndoorLocation>) => ({
      ...state,
      currentLocation: action.payload,
    }),
    setCurrentLocationStates: (state: IndoorState, action: PayloadAction<LocationStates>) => {
      return {
        ...state,
        currentStates: action.payload,
      }
    },
    setCurrentLocationState: (state: IndoorState, action: PayloadAction<[string, LocationState | undefined]>) => {
      const [stateName, stateValue] = action.payload;
      return {
        ...state,
        currentStates: {
          ...state.currentStates,
          [stateName]: stateValue,
        },
      }
    },
    resetCurrentIndoorLocation: (state: IndoorState, action: PayloadAction) => ({
      ...state,
      currentLocation: undefined,
      currentStates: {},
    }),
  },
});

export const {
  resetCurrentIndoorLocation,
  setCurrentLocationState,
} = indoorSlice.actions;

export const selectCurrentIndoorLocation = (state: RootState) => state.indoor.currentLocation;
export const selectCurrentIndoorStates = (state: RootState) => state.indoor.currentStates;

export const setCurrentIndoorLocation = (location: IndoorLocation): AppThunk =>
  async (dispatch, getState) => {
    dispatch(indoorSlice.actions.setCurrentIndoorLocation(location));

    const currentLocation = getState().locationData.current.location;
    const statesets = currentLocation ? getLocationStatesets(currentLocation) : [];
    if (statesets.length === 0) {
      return;
    }

    const states: LocationStates = zip(statesets.map(({ stateSetName }) => [stateSetName, { loaded: false }]));
    // Use a copy of states since redux seals the dispatched action's payload
    // to prevent store modification bu we want to reuse the states later
    dispatch(indoorSlice.actions.setCurrentLocationStates({ ...states }));

    const promises: Promise<void>[] = statesets.map(
      ({ stateSetId, stateSetName }) =>
        fetchFeatureState(stateSetId, stateSetName, location.id)
          .then(value => {
            states[stateSetName] = { value, loaded: true };
          })
    );

    await Promise.all(promises);
    dispatch(indoorSlice.actions.setCurrentLocationStates(states));
  };

export default indoorSlice.reducer;

const fetchFeatureState = async (
  statesetId: string,
  statesetName: string,
  featureId: string
): Promise<number | undefined> => {
  const url = `https://us.atlas.microsoft.com/featureState/state?api-version=1.0&statesetId=${statesetId}&featureId=${featureId}&subscription-key=${subscriptionKey}`;

  try {
    const res = await fetch(url);
    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}`);
    }

    const body = await res.json();
    return body.states.find((state: any) => state.keyName === statesetName)?.value;
  } catch (error) {
    console.warn(`Failed to fetch feature state for feature ${featureId}, stateset ${statesetId}: ${error}`);
  }
};

const getLocationStatesets = (location: LocationData) => {
  let statesets = location.config?.stateSets;
  if (statesets === undefined && location.type === LocationType.Floor) {
    statesets = location.parent?.config?.stateSets;
  }

  return statesets ?? [];
};

/**
 * Zip turns an array of 2-item tuples into a dictionary
 * @param list of items to be zipped into dictionary
 */
const zip = <T>(items: [string, T][]): { [k: string]: T } =>
  items.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
