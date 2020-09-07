import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AppThunk, RootState } from '../store/store';
import { LoadingState } from '../models/loadingState';
import { sensorsDataUrl } from '../config';

interface SensorData {
  id: string;
  name: string;
  sensorClass: string;
  roomId: string;
  readings: {
    name: string;
    value: string;
    updatedAt: string;
  }[]
}

export interface SensorsState {
  byLocationAndRoom: { [locId: string]: SensorData[] | undefined };
  loadingState: LoadingState;
};

const initialState: SensorsState = {
  byLocationAndRoom: {},
  loadingState: LoadingState.Loading,
};

interface SetSensorsDataPayload {
  path: string;
  data: any;
  loadingState: LoadingState;
}

const parseSensorData = (path: string, rawData: any): { [locId: string]: SensorData[] } => {
  const result: { [locId: string]: SensorData[] } = {};

  try {
    const roomsDict = rawData?.Value?.Rooms;
    if (roomsDict) {
      Object.keys(roomsDict).forEach(roomId => {
        const locId = `${path}/${roomId}`;
        const sensors = Object.values(roomsDict[roomId].Devices)
          .map((rawDevice: any): SensorData => ({
            id: rawDevice.DeviceId,
            roomId,
            sensorClass: rawDevice.EquipmentClass,
            name: rawDevice.Equipment,
            readings: rawDevice.Tags.map((tag: any) => ({
              name: tag.Tag,
              value: tag.Value,
              updatedAt: tag.Timestamp,
            })),
          }));

        result[locId] = sensors;
      })
    }
  } catch (error) {
    // Do nothing, just return the default value
    console.error("Failed to parse sensor data");
  }

  return result;
}

export const sensorsSlice = createSlice({
  name: 'temperature',
  initialState,
  reducers: {
    setSensorsData: (state: SensorsState, action: PayloadAction<SetSensorsDataPayload>) => {
      const { data, path, loadingState } = action.payload;
      const sensorData = parseSensorData(path, data);

      return {
        ...state,
        loadingState,
        byLocationAndRoom: {
          ...state.byLocationAndRoom,
          ...sensorData,
        },
      };
    },
    setLoadingState: (state: SensorsState, action: PayloadAction<LoadingState>) => ({
      ...state,
      loadingState: action.payload,
    }),
  },
});

const { setSensorsData, setLoadingState } = sensorsSlice.actions;

export default sensorsSlice.reducer;

export const selectSensorsLoadingState = (state: RootState): LoadingState => state.sensors.loadingState;

export const selectCurrentSensorsData = (state: RootState): SensorData[] | undefined => {
  const currentLocation = state.locationData.current.location;
  const currentIndoorLocation = state.indoor.currentLocation;

  if (currentLocation === undefined || currentIndoorLocation === undefined) {
    return;
  }

  const normalizedLocation = currentIndoorLocation.name.replace('-', '');
  const key = `${currentLocation.id}/${normalizedLocation}`;
  return state.sensors.byLocationAndRoom[key];
}

let fetchSensorsStateData = async (locationPath: string): Promise<any> => {
  const url = sensorsDataUrl.replace("{locationPath}", locationPath);
  const response: Response = await fetch(url);

  if (response.ok) {
    const json = await response.json();
    return json ?? {};
  } else {
    throw new Error();
  }
}

export const fetchSensors = (path: string): AppThunk => async dispatch => {
  dispatch(setLoadingState(LoadingState.Loading));

  try {
    const data = await fetchSensorsStateData(path);
    dispatch(setSensorsData({ path, data, loadingState: LoadingState.Ready }));
  } catch {
    console.error("Failed to get sensors info");
    dispatch(setSensorsData({ path, data: {}, loadingState: LoadingState.Error }));
  };
};
