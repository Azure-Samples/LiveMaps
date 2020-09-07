import './LocationBreadcrumb.scss';

import React from 'react';
import {
  Breadcrumb,
  DirectionalHint,
  IBreadcrumbItem,
  IComponentAsProps,
  IconButton,
  IDividerAsProps,
} from '@fluentui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import LocationSwitcher from '../LocationSwitcher/LocationSwitcher';
import {
  changeLocation,
  selectCurrentLocationData,
  selectCurrentLocationSegments,
  selectLocationsData,
} from '../../reducers/locationData';
import { AllLocationsData, LocationData, LocationType } from '../../models/locationsData';
import { mapService } from '../../services/mapService';
import { fetchSidebar } from '../../reducers/sidebar';

let isMounted: boolean = false;
let previousLocation: LocationData | undefined = undefined;

const LocationBreadcrumb: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const currentLocation: LocationData | undefined = useSelector(selectCurrentLocationData);
  const currentLocationSegments = useSelector(selectCurrentLocationSegments);
  const allLocationsData: AllLocationsData = useSelector(selectLocationsData);

  const [locationSwitcherTarget, setLocationSwitcherTarget] = React.useState<string | Element | null>(null);
  const [clickedLocationId, setClickedLocationId] = React.useState('');

  const nextLocationKey: string = 'next-level';
  const currentLocationId: string = currentLocation?.id ?? '';

  React.useEffect(() => {
    if (!isMounted && currentLocation) {
      isMounted = true;
      return;
    }

    if (previousLocation === currentLocation) {
      return;
    }

    if (!currentLocation?.items?.length) {
      if (
        currentLocation
        && currentLocation?.type === LocationType.Floor
        && allLocationsData[clickedLocationId]?.type === LocationType.Building
      ) {
        setLocationSwitcherTarget(`[id='${currentLocationId}']`);
        setClickedLocationId(currentLocation.id);
      } else {
        setLocationSwitcherTarget(null);
      }
    } else {
      setLocationSwitcherTarget(`[id='${nextLocationKey}']`);
      setClickedLocationId(nextLocationKey);
    }

    return () => {
      previousLocation = currentLocation;
    }
  }, [currentLocation, allLocationsData, clickedLocationId, currentLocationId]);

  if (!currentLocation || !currentLocationId) {
    return (
      <div className="location-breadcrumb-container"></div>
    );
  }

  const isCurrentLocation = (locationId: string) => locationId === currentLocationId;

  const onItemClick = (
    event?: React.MouseEvent<HTMLElement, MouseEvent>,
    item?: IBreadcrumbItem
  ) => {
    if (!item || !event?.currentTarget) {
      return;
    }

    const newClickedLocationId: string = item.key;
    const newLocation = allLocationsData[newClickedLocationId];

    if (!newLocation) {
      return;
    }

    if (isCurrentLocation(newClickedLocationId)) {
      mapService.flyTo(newLocation);
      setLocationSwitcherTarget(event.currentTarget as Element);
      dispatch(fetchSidebar(newLocation));
    } else {
      dispatch(changeLocation(newClickedLocationId, history));
    }

    setClickedLocationId(newClickedLocationId);
  }

  const onDividerClick = (event?: React.MouseEvent<any>) => {
    if (!event?.currentTarget) {
      return;
    }

    const clickedLocationId: string = event.currentTarget.id;

    setLocationSwitcherTarget(`.divider[id='${clickedLocationId}']`);
    setClickedLocationId(clickedLocationId);
  }

  const onLocationSwitcherItemClick = (location: LocationData, breadcrumbItems: IBreadcrumbItem[]) => {
    if (!location) {
      return;
    }

    if (isCurrentLocation(location.id)) {
      if (!location.items?.length) {
        setLocationSwitcherTarget(null);
      } else {
        setLocationSwitcherTarget(`[id='${nextLocationKey}']`);
        setClickedLocationId(nextLocationKey);
      }

      return;
    } else if (
      location.type === LocationType.Building
      && location.id === clickedLocationId
      && location.items?.length
    ) {
      const clickedItemIndex: number = breadcrumbItems.findIndex(
        (item: IBreadcrumbItem) => item.key === location.id
      );
      const nextItem = breadcrumbItems[clickedItemIndex + 1];
      const nextLocationId: string = nextItem.key;

      setLocationSwitcherTarget(`[id='${nextLocationId}']`);
      setClickedLocationId(nextLocationId);
      return;
    }

    setClickedLocationId(location.id);
    dispatch(changeLocation(location.id, history));
  };

  const render = () => {
    const breadcrumbItems: IBreadcrumbItem[] = currentLocationSegments.map((location, idx) => ({
      text: location.name,
      key: location.id,
      isCurrentItem: idx === currentLocationSegments.length - 1,
      onClick: onItemClick,
    }));


    let isFinalLevel: boolean = !currentLocation.items?.length;

    if (!isFinalLevel) {
      breadcrumbItems.push({
        text: '',
        key: nextLocationKey,
      });
    }

    let clickedLocationParentId: string = '';

    if (clickedLocationId) {
      if (clickedLocationId === nextLocationKey) {
        clickedLocationParentId = currentLocationId;
      } else {
        clickedLocationParentId = allLocationsData[clickedLocationId]?.parent?.id ?? '';
      }
    }

    return (
      <div className="location-breadcrumb-container">
        <Breadcrumb
          items={breadcrumbItems}
          maxDisplayedItems={isFinalLevel ? 3 : 4}
          ariaLabel="Breadcrumb with locations"
          overflowAriaLabel="More locations"
          styles={{
            root: 'location-breadcrumb',
            itemLink: 'item-button',
            listItem: `list-item ${isFinalLevel ? 'final-level' : ''}`,
            overflowButton: 'overflow-button'
          }}
          dividerAs={(props: React.PropsWithChildren<IComponentAsProps<IDividerAsProps>>) => {
            if (!props.item) {
              return null;
            }

            const nextItem = breadcrumbItems[breadcrumbItems.indexOf(props.item) + 1];

            if (!nextItem) {
              return null;
            }

            return (
              <IconButton
                id={nextItem.key}
                iconProps={{
                  iconName: 'ChevronRight',
                }}
                styles={{
                  root: 'divider',
                  icon: 'divider-icon'
                }}
                onClick={onDividerClick}
                contentEditable={false}
                ariaLabel="Next location"
              />
            );
          }}
        />

        {!!locationSwitcherTarget && !!clickedLocationId && !!clickedLocationParentId && (
          <LocationSwitcher
            target={locationSwitcherTarget}
            currentLocationId={clickedLocationId}
            locations={allLocationsData[clickedLocationParentId]?.items ?? []}
            directionalHint={DirectionalHint.bottomLeftEdge}
            onDismiss={() => setLocationSwitcherTarget(null)}
            onItemClick={(location: LocationData) => onLocationSwitcherItemClick(location, breadcrumbItems)}
          />
        )}
      </div>
    );
  }

  return render();
};

export default LocationBreadcrumb;
