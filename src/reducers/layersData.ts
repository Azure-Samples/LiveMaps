import { createSlice, PayloadAction, Action } from '@reduxjs/toolkit';

import { RootState } from '../store/store';
import { mapService } from "../services/mapService";

export interface LayersVisibilityState {
  [id: string]: boolean;
}

export interface LayersState {
  visibilityState: LayersVisibilityState;
}

// Syncs visibility as map service can change visibility of other
// layers if they are mutually exclusive
const refreshVisibilityState = (): LayersVisibilityState => {
  const state: LayersVisibilityState = {};
  mapService.getLayersInfo().forEach(({ id }) => {
    state[id] = mapService.isLayerVisible(id)
  });

  return state;
}

const initialState: LayersState = {
  visibilityState: {},
}

interface LayerVisibilityPayload {
  id: string;
  isVisible: boolean;
}

export const layersDataSlice = createSlice({
  name: 'layersData',
  initialState,
  reducers: {
    refreshVisibility: (state: LayersState, action: Action) => ({
      visibilityState: refreshVisibilityState(),
    }),
    setLayerVisibility: (state: LayersState, action: PayloadAction<LayerVisibilityPayload>) => {
      const { id, isVisible } = action.payload;
      try {
        mapService.setLayerVisibility(id, isVisible);

        return {
          visibilityState: refreshVisibilityState(),
        };
      } catch (err) {
        console.error(err);
        // Do nothing - assume visibility not changed
      }
    },
    setLayersVisibility: (state: LayersState, action: PayloadAction<LayersVisibilityState>) => {
      const layersVisibility: LayersVisibilityState = action.payload;
      Object.keys(layersVisibility).forEach(
        id => mapService.setLayerVisibility(id, layersVisibility[id])
      );

      return {
        visibilityState: layersVisibility,
      }
    },
  },
});

export const {
  refreshVisibility,
  setLayerVisibility,
  setLayersVisibility,
} = layersDataSlice.actions;

export const selectLayersVisibility = (state: RootState) => state.layersData.visibilityState;
export const selectLayerVisibility = (layerId: string) =>
  (state: RootState) => !!state.layersData.visibilityState[layerId];

export default layersDataSlice.reducer;
