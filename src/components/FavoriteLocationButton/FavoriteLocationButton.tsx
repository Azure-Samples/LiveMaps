import './FavoriteLocationButton.scss';

import React, { useCallback, useState, useEffect } from 'react';
import { IconButton, } from '@fluentui/react';
import { useSelector } from 'react-redux';

import { favoritesService } from '../../services/favoritesService';
import { selectCurrentLocationId } from '../../reducers/locationData';
import { LayersVisibilityState, selectLayersVisibility } from '../../reducers/layersData';

export interface FavoriteLocationButtonProps {
  locationId: string;
  locationName: string;
}

const FavoriteLocationButton: React.FC<FavoriteLocationButtonProps> = ({
  locationId,
  locationName,
}) => {
  const currentLocationId: string | undefined = useSelector(selectCurrentLocationId);
  const layersVisibility: LayersVisibilityState = useSelector(selectLayersVisibility);
  const [isFavorite, makeFavorite] = useState(favoritesService.isFavorite(locationId));

  useEffect(() => {
    makeFavorite(favoritesService.isFavorite(locationId));
  }, [locationId]);

  const onFavoriteButtonClick = useCallback((event: React.MouseEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isFavorite) {
      favoritesService.removeFromFavorites(locationId);
    } else {
      favoritesService.addToFavorites(locationId, currentLocationId === locationId, layersVisibility);
    }

    makeFavorite(!isFavorite);
  }, [isFavorite, locationId, currentLocationId, layersVisibility]);

  if (!locationId || !locationName) {
    return null;
  }

  let starButtonAriaLabel: string;

  if (isFavorite) {
    starButtonAriaLabel = `Remove ${locationName} from favorite list`;
  } else {
    starButtonAriaLabel = `Add ${locationName} to favorite list`;
  }

  return (
    <IconButton
      id={locationId}
      className={`favorite-location-button ${isFavorite ? 'checked' : ''}`}
      ariaLabel={starButtonAriaLabel}
      onClick={onFavoriteButtonClick}
      iconProps={{ iconName: "FavoriteStarFill" }}
    />
  );
};

export default FavoriteLocationButton;
