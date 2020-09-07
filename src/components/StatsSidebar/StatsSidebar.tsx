import './StatsSidebar.scss';

import React, { useState } from 'react';
import { GroupedList, IGroup, IGroupHeaderProps, IRenderFunction } from '@fluentui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Dispatch } from '@reduxjs/toolkit';

import { selectCurrentSidebarData, selectSidebarContext, selectSidebarLoadingState } from '../../reducers/sidebar';
import { selectCurrentSensorsData, selectSensorsLoadingState } from '../../reducers/sensors';
import { PieChart } from './PieChart/PieChart';
import { TextLabel } from './TextLabel/TextLabel';
import { GroupHeader } from './GroupHeader/GroupHeader';
import {
  AlertData,
  LabelData,
  SidebarData,
  SidebarGroup,
  SidebarItemData,
} from '../../models/sidebar';
import {
  IndoorLocation,
  LocationStates,
  selectCurrentIndoorLocation,
  selectCurrentIndoorStates,
} from '../../reducers/indoor';
import { updateIndoorStateSimulation } from "../../reducers/simulation";
import { selectWarningsData, selectWarningsLoadingState } from '../../reducers/warnings';
import { WarningData, WarningsByLayers, WarningsByLocation, WarningsByRooms } from '../../models/warningsData';
import { selectCurrentLocationData } from '../../reducers/locationData';
import { LocationData, LocationType } from '../../models/locationsData';
import { Alert } from './Alert/Alert';
import { SliderControl } from './SliderControl/SliderControl';
import { getHeaderColorByGroupId } from '../../utils/statsSidebarUtils';
import { LoadingState } from '../../models/loadingState';
import { StatsSidebarShimmer } from './StatsSidebarShimmer/StatsSidebarShimmer';
import { BarChart } from './BarChart/BarChart';
import { VerticalBarChart } from './VerticalBarChart/VerticalBarChart';
import { LineChart } from './LineChart/LineChart';
import { SliderChart } from './SliderChart/SliderChart';

interface GroupsCollapsedState {
  [groupId: string]: boolean | undefined;
}

const processSidebarData = (data: SidebarData, collapsedState: GroupsCollapsedState): [IGroup[], SidebarItemData[]] => {
  const groups: IGroup[] = [];
  const items: SidebarItemData[] = [];

  let startIndex = 0;

  data.forEach(group => {
    groups.push({
      key: group.id,
      name: group.name,
      count: group.items.length,
      startIndex: startIndex,
      isCollapsed: collapsedState[group.id] ?? group.collapsed,
    });

    startIndex += group.items.length;
    group.items.forEach(item => items.push(item));
  });

  return [groups, items];
};

const renderItem = (depth?: number, item?: SidebarItemData, index?: number) => {
  if (!item) {
    return null;
  }

  switch (item.type) {
    case 'label': {
      const { name, value } = item.data;
      return <TextLabel label={name} value={value} />;
    }
    case 'alert': {
      const { name, url, iconName, iconColor } = item.data;
      return <Alert label={name} url={url} iconName={iconName} iconColor={iconColor} />;
    }
    case 'pie':
      return <PieChart data={item.data} />;
    case 'line':
      return (
        <LineChart
          data={item.data}
          colors={item.colors}
          names={item.names}
          minValue={item.minValue}
          maxValue={item.maxValue}
        />
      );
    case 'bar':
      return <BarChart data={item.data} />;
    case 'verticalBar':
      return <VerticalBarChart data={item.data} />;
    case 'slider': {
      const { value, unit, minValue, maxValue, color } = item.data[0];
      return <SliderChart value={value} unit={unit} minValue={minValue} maxValue={maxValue} color={color} />;
    }
    case 'slider_control':
      return <SliderControl {...item.data} />;
    default:
      return null;
  }
};

const getRoomAlerts = (alertsByLayers: WarningsByLayers | undefined): AlertData[] => {
  if (!alertsByLayers) {
    return [];
  }

  const items: AlertData[] = [];

  for (const layerId in alertsByLayers) {
    const alerts: WarningData[] = alertsByLayers[layerId] ?? [];

    alerts.forEach((alert: WarningData) => {
      if (alert.description) {
        const link: AlertData = {
          type: 'alert',
          data: {
            name: alert.description,
            iconName: 'Warning12',
            iconColor: 'red',
            url: alert.url,
          }
        };

        items.push(link);
      }
    });
  }

  return items;
}

const getFloorAlerts = (data: WarningsByLocation, floorId: string, roomName?: string): AlertData[] => {
  const locationAlerts: WarningsByRooms | undefined = data[floorId];
  if (!locationAlerts) {
    return [];
  }

  let roomKey: string | undefined = roomName?.replace(new RegExp('-', 'g'), '');

  let items: AlertData[] = [];
  if (roomKey) {
    items = getRoomAlerts(locationAlerts[roomKey]);
  } else {
    for (const room in locationAlerts) {
      items = items.concat(getRoomAlerts(locationAlerts[room]));
    }
  }

  return items;
}

const getAlertsGroup = (
  data: WarningsByLocation,
  currentLocation: LocationData,
  context: LocationType,
  roomName?: string,
): SidebarGroup | undefined => {
  if (currentLocation.type !== LocationType.Floor && currentLocation.type !== LocationType.Building) {
    return;
  }

  let items: AlertData[] = [];

  if (context === LocationType.Floor && currentLocation.type === LocationType.Floor) {
    items = getFloorAlerts(data, currentLocation.id, roomName);
  } else {
    for (const floorId in data) {
      items = items.concat(getFloorAlerts(data, floorId, roomName));
    }
  }

  if (!items.length) {
    return;
  }

  return {
    id: 'alerts',
    name: `Alerts (${items.length})`,
    items: items,
  };
}

export const StatsSidebar: React.FC = () => {
  const currentLocation: LocationData = useSelector(selectCurrentLocationData);
  const currentSidebarData: SidebarData | undefined = useSelector(selectCurrentSidebarData);
  const currentIndoorLocation: IndoorLocation | undefined = useSelector(selectCurrentIndoorLocation);
  const currentIndoorStates = useSelector(selectCurrentIndoorStates);
  const currentSensorsState = useSelector(selectCurrentSensorsData);
  const warnings: WarningsByLocation = useSelector(selectWarningsData);
  const context: LocationType = useSelector(selectSidebarContext).type;

  const dispatch = useDispatch();
  const { search: query } = useLocation();
  const isSimulationEditor = parseQueryString(query)["sim"] !== undefined;

  const sidebarLoadingState: LoadingState = useSelector(selectSidebarLoadingState);
  const sensorsLoadingState: LoadingState = useSelector(selectSensorsLoadingState);
  const warningsLoadingState: LoadingState = useSelector(selectWarningsLoadingState);

  const [groupsState, setGroupsState] = useState<GroupsCollapsedState>({});

  if (
    sidebarLoadingState === LoadingState.Loading
    || sensorsLoadingState === LoadingState.Loading
    || warningsLoadingState === LoadingState.Loading
  ) {
    return (
      <div className="stats-sidebar">
        <StatsSidebarShimmer />
      </div>
    );
  }

  let sidebarData: SidebarData = [];

  if (currentIndoorLocation) {
    const items: SidebarItemData[] = [
      { type: "label", data: { name: "Room Type", value: currentIndoorLocation.type } },
      { type: "label", data: { name: "Floor", value: currentIndoorLocation.floor } },
    ];

    Object.entries(currentIndoorStates).forEach(([name, state]) => {
      const { value, loaded } = state!;
      let val = value === undefined ? "Unknown" : value + "";
      if (!loaded) {
        val = "Loading...";
      }

      items.push({
        type: "label",
        data: {
          name: capitalize(name),
          value: val,
        }
      })
    });

    sidebarData = [
      {
        id: currentIndoorLocation.name,
        name: currentIndoorLocation.name,
        items,
      },
    ];

    if (isSimulationEditor) {
      sidebarData.push(makeSimulationControls(
        currentIndoorLocation.name.replace("-", ""),
        currentIndoorLocation.name,
        currentIndoorStates,
        dispatch,
      ));
    }
  }

  if (currentSensorsState) {
    const sensorsSidebarData: SidebarData = currentSensorsState.map(({ id, roomId, name, sensorClass, readings }) => ({
      id,
      name: `${roomId}: ${name} #${id} (${sensorClass})`,
      collapsed: true,
      items: readings.map(({ name, value }): LabelData => ({
        type: "label",
        data: { name, value },
      })),
    }));

    sidebarData.push(...sensorsSidebarData);
  }

  if (currentSidebarData) {
    sidebarData.push(...currentSidebarData);
  }

  const alertsGroup: SidebarGroup | undefined = getAlertsGroup(
    warnings,
    currentLocation,
    context,
    currentIndoorLocation?.name
  );

  if (alertsGroup) {
    sidebarData.push(alertsGroup);
  }

  const [groups, items] = processSidebarData(sidebarData, groupsState);

  if (groups.length === 0) {
    return null;
  }

  const renderGroupHeader: IRenderFunction<IGroupHeaderProps> = props => {
    if (!props) {
      return null;
    }

    const { onToggleCollapse, ...rest } = props;
    const handleToggleCollapse = (group: IGroup) => {
      if (onToggleCollapse) {
        onToggleCollapse(group);
      }

      setGroupsState({ ...groupsState, [group.key]: !!group.isCollapsed });
    };

    return (
      <GroupHeader
        color={getHeaderColorByGroupId(props.group?.key ?? '')}
        onToggleCollapse={handleToggleCollapse}
        {...rest}
      />
    );
  };

  return (
    <div className="stats-sidebar">
      <GroupedList
        groups={groups}
        items={items}
        groupProps={{
          onRenderHeader: renderGroupHeader
        }}
        onRenderCell={renderItem}
      >
      </GroupedList>
    </div>
  );
};

const capitalize = (str: string): string => {
  if (str.length === 0) {
    return str;
  }

  const [first, ...rest] = str.split("");
  return first.toUpperCase() + rest.join("");
};

const parseQueryString = (query: string): Record<string, any> => {
  return query.slice(1).split("&")
    .reduce<Record<string, any>>((acc, q) => {
      const [key, val] = q.split("=");
      if (key !== undefined && val !== undefined) {
        acc[key] = val;
      }
      return acc;
    }, {});
};

const makeSimulationControls = (
  roomId: string,
  roomName: string,
  indoorStates: LocationStates,
  dispatch: Dispatch<any>
): SidebarGroup => {
  const controls: SidebarGroup = {
    id: `sim#${roomName}`,
    name: `${roomName}: simulation`,
    items: [],
  };

  const temperatureState = indoorStates["temperature"];
  if (temperatureState) {
    controls.items.push({
      type: "slider_control",
      data: {
        name: "Temperature",
        value: temperatureState.value,
        minValue: 59,
        maxValue: 86,
        disabled: temperatureState.loaded === false,
        onSave: (value: number) => dispatch(updateIndoorStateSimulation(roomId, "temperature", value)),
      }
    });
  }

  const occupancyState = indoorStates["occupancy"];
  if (occupancyState !== undefined) {
    controls.items.push({
      type: "slider_control",
      data: {
        name: "Occupancy",
        value: occupancyState.value,
        minValue: 0,
        maxValue: 15,
        disabled: occupancyState.loaded === false,
        onSave: (value: number) => dispatch(updateIndoorStateSimulation(roomId, "occupancy", value)),
      }
    });
  }

  return controls;
};
