import './App.scss';

import React, { useEffect } from 'react';
import { initializeIcons } from '@uifabric/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import AppHeader from './components/AppHeader/AppHeader';
import Map from './components/Map/Map';
import SideNavBar from './components/SideNavBar/SideNavBar';
import { StatsSidebar } from './components/StatsSidebar/StatsSidebar';
import {
  fetchLocationsInfo,
  selectLocationsDataLoaded,
  updateCurrentLocation,
} from './reducers/locationData';
import { fetchUserInfo } from './reducers/user';

initializeIcons();

const App: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { pathname: path } = useLocation();

  useEffect(() => {
    dispatch(fetchUserInfo());
    dispatch(fetchLocationsInfo(path, history));
    // Don't add `path` to deps as we want to trigger this
    // effect only once, not on every location change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, history]);


  const isLoaded = useSelector(selectLocationsDataLoaded);
  useEffect(() => {
    if (isLoaded) {
      // Only parse path and update current location when locations data has
      // been loaded otherwise there is a race condition between this update
      // and update triggered by`fetchLocationsInfo`
      dispatch(updateCurrentLocation(path, history));
    }
  }, [dispatch, history, isLoaded, path])

  return (
    <div className="App">
      <AppHeader />

      <main>
        <SideNavBar />
        <Map />
        <StatsSidebar />
      </main>
    </div>
  );
};

export default App;
