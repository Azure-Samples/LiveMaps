import React, { useCallback, useState, useEffect } from 'react';
import { DirectionalHint } from '@fluentui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { SearchCallout } from '../SearchCallout/SearchCallout';
import { RoomData, RoomsByFloorId } from '../../models/roomsData';
import { selectRoomsData } from '../../reducers/rooms';
import { selectCurrentIndoorLocation } from '../../reducers/indoor';
import { changeLocation, selectCurrentLocationId } from '../../reducers/locationData';
import { mapService } from '../../services/mapService';

export interface RoomsNavigatorProps {
  target?: string | Element | MouseEvent | React.RefObject<Element>;
  onDismiss?: () => void;
}

interface RoomItem extends RoomData {
  id: string;
  locationId: string;
}

const processRoomData = (
  roomsData: RoomsByFloorId, selectedRoomId: string | undefined
): [RoomItem[], RoomItem | undefined] => {
  const rooms: RoomItem[] = [];
  let selectedRoom: RoomItem | undefined;

  for (const floorId in roomsData) {
    const floorData = roomsData[floorId];

    for (const roomId in floorData) {
      if (!floorData[roomId]) {
        continue;
      }

      const roomItem: RoomItem = {
        ...floorData[roomId]!,
        id: roomId,
        locationId: floorId,
      };

      rooms.push(roomItem);

      if (selectedRoomId === roomId) {
        selectedRoom = roomItem;
      }
    }
  }

  return [rooms, selectedRoom];
};

export const RoomsNavigator: React.FC<RoomsNavigatorProps> = ({
  target,
  onDismiss,
}) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const currentLocationId: string | undefined = useSelector(selectCurrentLocationId);
  const roomsData: RoomsByFloorId = useSelector(selectRoomsData);
  const selectedRoomName: string | undefined = useSelector(selectCurrentIndoorLocation)?.name;

  const [clickedRoom, setClickedRoom] = useState<RoomData | undefined>(undefined);

  const selectedRoomId = selectedRoomName?.replace(new RegExp('-', 'g'), '');
  const [rooms, selectedRoom] = processRoomData(roomsData, selectedRoomId);

  const showRoom = useCallback((room?: RoomData) => {
    if (room) {
      mapService.showObject(room);
      setClickedRoom(undefined);

      if (onDismiss) {
        onDismiss();
      }
    }
  }, [onDismiss]);

  useEffect(() => {
    showRoom(clickedRoom);
  // here we need to show room after location change only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocationId]);

  const onRoomClick = useCallback((room: RoomItem) => {
    if (room.locationId !== currentLocationId) {
      // we need this here to await the reducer complete to avoid the animation reset on location change
      dispatch(changeLocation(room.locationId, history));
      setClickedRoom(room);
    } else {
      showRoom(room);
    }
  }, [currentLocationId, showRoom, dispatch, history]);

  return (
    <SearchCallout
      items={rooms}
      selectedItem={selectedRoom}
      target={target}
      searchOptions = {{
        findAllMatches: true,
        keys: ['name', 'type', 'unitId'],
      }}
      groupName="rooms"
      directionalHint={DirectionalHint.rightTopEdge}
      getItemText={(room: RoomItem) => (
        room.name ? `${room.type}: ${room.name} (${room.unitId})` : `${room.type}: ${room.unitId}`
      )}
      onItemClick={onRoomClick}
      onDismiss={onDismiss}
    />
  );
};
