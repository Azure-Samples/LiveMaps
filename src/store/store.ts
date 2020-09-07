import { Action, configureStore, ThunkAction, getDefaultMiddleware } from '@reduxjs/toolkit';

import indoor from '../reducers/indoor';
import layersData from '../reducers/layersData';
import locationData from '../reducers/locationData';
import map from '../reducers/map';
import popovers from '../reducers/popover';
import rooms from '../reducers/rooms';
import sensors from '../reducers/sensors';
import sidebar from '../reducers/sidebar';
import user from '../reducers/user';
import warnings from '../reducers/warnings';

export const store = configureStore({
  reducer: {
    indoor,
    layersData,
    locationData,
    map,
    sensors,
    sidebar,
    user,
    popovers,
    warnings,
    rooms,
  },
  middleware: [...getDefaultMiddleware({
    immutableCheck: false,
    serializableCheck: false,
  })]
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
