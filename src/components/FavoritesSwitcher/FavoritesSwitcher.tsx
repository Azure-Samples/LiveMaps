import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { DirectionalHint } from '@fluentui/react';

import LocationSwitcher from '../LocationSwitcher/LocationSwitcher';
import { Favorites, favoritesService } from '../../services/favoritesService';
import { AllLocationsData, LocationData } from '../../models/locationsData';
import { changeLocation, selectLocationsData, selectCurrentLocationId } from '../../reducers/locationData';
import { NoFavorites } from './NoFavorites/NoFavorites';
import { getFullLocationName } from '../../utils/locationsUtils';

export interface FavoritesSwitcherProps {
  target: string | Element | MouseEvent | React.RefObject<Element>;
  onDismiss?: () => void;
}

export const FavoritesSwitcher: React.FC<FavoritesSwitcherProps> = ({
  target,
  onDismiss,
}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const allLocationsData: AllLocationsData = useSelector(selectLocationsData);
  const currentLocationId: string | undefined = useSelector(selectCurrentLocationId);
  const favorites: Favorites = favoritesService.getFavorites();
  const favoriteLocations: string[] = Object.keys(favorites);

  const renderItemName = useCallback((locationId: string) => {
    return getFullLocationName(locationId, allLocationsData);
  }, [allLocationsData]);

  if (!favoriteLocations.length) {
    return (
      <NoFavorites target={target} onDismiss={onDismiss}/>
    );
  }

  return (
    <LocationSwitcher
      target={target}
      currentLocationId={currentLocationId ?? ''}
      locations={favoriteLocations}
      directionalHint={DirectionalHint.rightTopEdge}
      onDismiss={onDismiss}
      onItemClick={(location: LocationData) => {
        dispatch(changeLocation(location.id, history));

        if (onDismiss) {
          onDismiss();
        }
      }}
      renderItemName={renderItemName}
    />
  );
};
