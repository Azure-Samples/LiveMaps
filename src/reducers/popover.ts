import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from '../store/store';
import { PopoverType, PopoverData } from '../models/popoversData';

export interface PopoversState {
  [PopoverType.Warning]: PopoverData;
}

const initialState: PopoversState = {
  [PopoverType.Warning]: {
    type: PopoverType.Warning,
    isVisible: false,
  }
};

export const popoversDataSlice = createSlice({
  name: 'popovers',
  initialState,
  reducers: {
    showPopover: (state: PopoversState, action: PayloadAction<PopoverData>) => {
      const popoverType: PopoverType = action.payload.type;
      state[popoverType] = action.payload;
    },
    hidePopover: (state: PopoversState, action: PayloadAction<PopoverType>) => {
      const popoverType = action.payload;

      state[popoverType].isVisible = false;
      state[popoverType].target = undefined;
    }
  },
});

export const {
  showPopover,
  hidePopover,
} = popoversDataSlice.actions;

export const selectWarningPopoverData = (state: RootState) => state.popovers[PopoverType.Warning];

export default popoversDataSlice.reducer;
