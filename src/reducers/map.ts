import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store/store';

export interface MapState {
  zoomLevel?: number;
};

const initialState: MapState = {};

export const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapZoomLevel: (state: MapState, action: PayloadAction<number | undefined>) => ({ zoomLevel: action.payload }),
  },
});

export const {
  setMapZoomLevel,
} = mapSlice.actions;

export const selectMapZoomLevel = (state: RootState) => state.map.zoomLevel;

export default mapSlice.reducer;
