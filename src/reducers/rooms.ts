import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RoomDataSchema, RoomsByFloorId } from '../models/roomsData';
import { LoadingState } from '../models/loadingState';
import { AppThunk, RootState } from '../store/store';
import { mapService } from '../services/mapService';

import { roomsDataUrl } from '../config';

export interface RoomsState {
  roomsByFloorId: RoomsByFloorId;
  loadingState: LoadingState;
}

const initialState: RoomsState = {
  roomsByFloorId: {},
  loadingState: LoadingState.Loading,
};

const isRoomsData = (data: any): data is RoomsByFloorId => {
  try {
    for (const floorId in data) {
      for (const roomId in data[floorId]) {
        const isValid = RoomDataSchema.isValidSync(data[floorId][roomId]);

        if (!isValid) {
          return false;
        }
      }
    }

    return true;
  } catch {
    console.error('Rooms data is not valid');
    return false;
  }
}

export const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRooms: (state: RoomsState, action: PayloadAction<RoomsByFloorId>) => {
      return {
        ...state,
        roomsByFloorId: action.payload,
        loadingState: LoadingState.Ready,
      }
    },
    setLoadingState: (state: RoomsState, action: PayloadAction<LoadingState>) => {
      const loadingState: LoadingState = action.payload;

      if (loadingState === LoadingState.Loading) {
        return {
          ...state,
          roomsByFloorId: {},
          loadingState,
        };
      }

      return {
        ...state,
        loadingState,
      };
    }
  }
});

const {
  setRooms,
  setLoadingState,
} = roomsSlice.actions;

export const selectRoomsLoadingState = (state: RootState) => state.rooms.loadingState;

export const selectRoomsData = (state: RootState) => state.rooms.roomsByFloorId;

export const selectRoomsCount = (state: RootState) => {
  const roomsByFloorId = state.rooms.roomsByFloorId;

  return Object.values(roomsByFloorId).reduce(
    (roomsCount, floorData) => floorData ? roomsCount + Object.keys(floorData).length : roomsCount,
    0
  );
}

export default roomsSlice.reducer;

const fetchRoomsData = async (locationId: string) => {
  const url = roomsDataUrl.replace("{locationPath}", locationId);
  const response: Response = await fetch(url);

  if (response.ok) {
    const json = await response.json();
    return json ?? {};
  } else {
    throw new Error();
  }
}

export const fetchRoomsInfo = (locationId?: string): AppThunk => async (dispatch, getState) => {
  dispatch(setLoadingState(LoadingState.Loading));
  mapService.updateRoomsData({});

  if (!locationId) {
    return;
  }

  try {
    const roomsByFloorId: any = await fetchRoomsData(locationId);

    if (isRoomsData(roomsByFloorId)) {
      dispatch(setRooms(roomsByFloorId));
      mapService.updateRoomsData(roomsByFloorId);
    } else {
      throw new Error('Rooms data is not valid');
    }
  } catch (e) {
    console.error(e.message ?? 'Failed to get rooms info');
    dispatch(setLoadingState(LoadingState.Error));
  };
};
