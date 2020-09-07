import { AppThunk } from '../store/store';
import { setCurrentLocationState } from './indoor';

export const updateIndoorStateSimulation = (roomId: string, stateName: string, value: number): AppThunk =>
  async (dispatch, getState) => {
    const currentLocationId = getState().locationData.current.location?.id;
    if (!currentLocationId) {
      return;
    }

    const code = "xwSenBKMqgZsxbiKwo0hxzbzddQ81Qjjy4xSuCNaFHLBlJ95GFJ0aQ==";
    const url = `https://ssirapi.azurewebsites.net/api/state/${currentLocationId}/${roomId}?code=${code}`;

    const prevValue = getState().indoor.currentStates[stateName]?.value;
    const fail = (error: string) => {
      console.warn(`Failed to set indoor state ${stateName} for ${roomId}: ${error}`);
      dispatch(setCurrentLocationState([stateName, { value: prevValue, loaded: true }]));
    }

    dispatch(setCurrentLocationState([stateName, { value: prevValue, loaded: false }]));
    try {
      const res = await fetch(url, { method: "POST", body: JSON.stringify({ [stateName]: value }) });
      if (res.status === 200) {
        dispatch(setCurrentLocationState([stateName, { value, loaded: true }]));
      } else {
        fail(`HTTP${res.status} ${res.statusText}`);
      }
    } catch (error) {
      fail(error);
    }
  };
