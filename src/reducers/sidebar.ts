import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AppThunk, RootState } from '../store/store';
import { SidebarData } from '../models/sidebar';
import { DEFAULT_LOCATION, LocationData } from '../models/locationsData';
import { LoadingState } from '../models/loadingState';
import { sidebarDataUrl } from '../config';

export interface SidebarState {
  data: SidebarData;
  context: LocationData;
  loadingState: LoadingState;
};

const initialState: SidebarState = {
  data: [],
  context: DEFAULT_LOCATION,
  loadingState: LoadingState.Loading,
};

interface SetSidebarDataPayload {
  data: any;
  loadingState: LoadingState;
}

const parseSidebarData = (rawData: any): SidebarData => {
  let result: SidebarData = [];

  if (rawData) {
    try {
      result = rawData.map((obj: any) => ({
        id: obj.id,
        name: obj.name,
        items: obj.items.map((item: any) => {
          if (!item) {
            throw new Error();
          }

          return item;
        }),
      }));
    } catch (error) {
      console.error("Failed to parse sidebar data")
    }
  }

  return result;
}

export const sidebarSlice = createSlice({
  name: 'temperature',
  initialState,
  reducers: {
    setSidebarData: (state: SidebarState, action: PayloadAction<SetSidebarDataPayload>) => {
      const { data, loadingState } = action.payload;

      return {
        ...state,
        loadingState,
        data: parseSidebarData(data),
      };
    },
    setSidebarContext: (state: SidebarState, action: PayloadAction<LocationData>) => ({
      ...state,
      context: action.payload,
    }),
  },
});

const {
  setSidebarData,
  setSidebarContext,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;

export const selectSidebarLoadingState = (state: RootState) => state.sidebar.loadingState;

export const selectSidebarContext = (state: RootState) => state.sidebar.context;

export const selectCurrentSidebarData = (state: RootState): SidebarData => {
  return state.sidebar.data;
}

let fetchSidebarData = async (locationPath: string): Promise<SidebarData> => {
  const url = sidebarDataUrl.replace("{locationPath}", locationPath);
  const response: Response = await fetch(url);

  if (response.ok) {
    const json = await response.json();
    return json ?? [];
  } else {
    throw new Error();
  }
}

export const fetchSidebar = (location: LocationData): AppThunk => async (dispatch, getState) => {
  const { sidebar: { context } } = getState();

  if (location.id === context.id) {
    return;
  }

  dispatch(setSidebarData({ data: [], loadingState: LoadingState.Loading }));
  dispatch(setSidebarContext(location));

  try {
    const data = await fetchSidebarData(location.id);
    dispatch(setSidebarData({ data, loadingState: LoadingState.Ready }));
  } catch {
    console.error("Failed to get current sidebar info");
    dispatch(setSidebarData({ data: [], loadingState: LoadingState.Error }));
  };
};
