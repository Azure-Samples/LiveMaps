import React from 'react';
import { DirectionalHint } from '@fluentui/react';
import { useSelector } from 'react-redux';

import FavoriteLocationButton from '../FavoriteLocationButton/FavoriteLocationButton';
import { AllLocationsData, LocationData } from '../../models/locationsData';
import { selectLocationsData } from '../../reducers/locationData';
import { SearchCallout } from '../SearchCallout/SearchCallout';

export interface LocationSwitcherProps {
  target?: string | Element | MouseEvent | React.RefObject<Element>;
  currentLocationId: string;
  locations: string[];
  directionalHint?: DirectionalHint;
  onItemClick?: (location: LocationData) => void;
  onDismiss?: () => void;
  renderItemName?: (locationId: string) => string;
}

const LocationSwitcher: React.FC<LocationSwitcherProps> = ({
  target,
  currentLocationId,
  locations,
  directionalHint,
  onItemClick,
  onDismiss,
  renderItemName,
}) => {
  const allLocationsData: AllLocationsData = useSelector(selectLocationsData);

  if (!locations?.length) {
    return null;
  }

  const items: LocationData[] = locations
    .map((locationId: string) => allLocationsData[locationId])
    .filter((location: LocationData | undefined) => !!location) as LocationData[];

  const selectedItem = items.find((item: LocationData) => item.id === currentLocationId);

  const getLocationName = (location: LocationData) => renderItemName ? renderItemName(location.id) : location.name;

  return (
    <SearchCallout
      items={items}
      selectedItem={selectedItem}
      target={target}
      searchOptions = {{
        findAllMatches: true,
        keys: ['name'],
        getFn: (location: LocationData) => getLocationName(location)
      }}
      groupName="locations"
      directionalHint={directionalHint}
      getItemText={getLocationName}
      onItemClick={onItemClick}
      onDismiss={onDismiss}
      renderItem={(location: LocationData, defaultRender) => defaultRender({
        children: (
          <FavoriteLocationButton
            locationId={location.id}
            locationName={getLocationName(location)}
          />
        )
      })}
    />
  );
};

export default LocationSwitcher;
