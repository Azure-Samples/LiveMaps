import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Popover from '../Popover';
import { LocationData } from '../../../models/locationsData';
import { selectCurrentLocationData } from '../../../reducers/locationData';
import { PopoverData, PopoverType } from '../../../models/popoversData';
import { hidePopover, selectWarningPopoverData } from '../../../reducers/popover';

export const WarningPopover = () => {
  const currentLocation: LocationData | undefined= useSelector(selectCurrentLocationData);
  const data: PopoverData = useSelector(selectWarningPopoverData);
  const dispatch = useDispatch();

  if (!currentLocation || !data.isVisible || !data.target) {
    return null;
  }

  return (
    <Popover
      title={data.title ?? ''}
      body={
        <strong>
          {currentLocation.name} {data.description ?? ''}
        </strong>
      }
      target={data.target}
      onDismiss={() => {
        dispatch(hidePopover(PopoverType.Warning));
      }}
    />
  );
}