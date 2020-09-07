import './Map.scss';

import ReactResizeDetector from 'react-resize-detector';
import React, { useCallback, useEffect } from 'react';
import { EventManager, MapEvent, MapMouseEvent, data, Map as AzureMap } from 'azure-maps-control';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from '@reduxjs/toolkit';

import { LocationData } from '../../models/locationsData';
import { setMapZoomLevel } from '../../reducers/map';
import { resetCurrentIndoorLocation, setCurrentIndoorLocation } from '../../reducers/indoor';
import { WarningPopover } from './WarningPopover/WarningPopover';
import { PopoverType } from '../../models/popoversData';
import { mapService } from '../../services/mapService';
import { hidePopover } from '../../reducers/popover';
import { selectCurrentLocationData } from '../../reducers/locationData';
import { selectLayersVisibility, refreshVisibility } from '../../reducers/layersData';

const handleLayerVisibilityChange = (layerId: string, isVisible: boolean) => {
  mapService.setLayerVisibility(layerId, isVisible);
}

let mapResizeTimeout: number | undefined;

const Map: React.FC = () => {
  const currentLocation: LocationData | undefined = useSelector(selectCurrentLocationData);
  const layersVisibility = useSelector(selectLayersVisibility);
  const dispatch: Dispatch<any> = useDispatch();

  const onMapReady = useCallback((map: AzureMap) => {
    mapService.getLayersInfo().forEach(({ id }) => {
      if (layersVisibility[id] !== undefined) {
        handleLayerVisibilityChange(id, layersVisibility[id]);
      }
    });
    dispatch(setMapZoomLevel(map.getCamera().zoom));
  }, [dispatch, layersVisibility]);

  const onZoomEnd = useCallback((e: MapEvent) => {
    dispatch(setMapZoomLevel(e.map.getCamera().zoom));
  }, [dispatch]);

  const onMapClick = useCallback((e: MapMouseEvent) => {
    const features = mapService.getFeatures(e.position);

    if (!features || !features.length) {
      dispatch(resetCurrentIndoorLocation());
      return;
    }

    const feature = (features[0] as data.Feature<data.Geometry, any>);
    if (!feature) {
      return;
    }

    const id = feature.properties.featureId;
    const name: string = feature.properties.name;
    const levelFeatureId: string = feature.properties.levelFeatureId;
    const type: string = feature.properties.featureType;
    const floor = currentLocation?.name;

    if (name != null && levelFeatureId != null) {
      dispatch(setCurrentIndoorLocation({ id, name, type, floor }));
    } else {
      dispatch(resetCurrentIndoorLocation());
    }
  }, [currentLocation, dispatch]);

  const hideWarningPopover = useCallback(
    () => dispatch(hidePopover(PopoverType.Warning)),
    [dispatch]
  );

  const handleLocationChange = useCallback(() => {
    hideWarningPopover();
  }, [
    hideWarningPopover,
  ]);

  useEffect(() => {
    dispatch(refreshVisibility);
    mapService.initialize(onMapReady, dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      mapService.dispose();
      mapResizeTimeout && clearTimeout(mapResizeTimeout);
    }
  }, []);

  useEffect(() => {
    handleLocationChange();
  }, [currentLocation, handleLocationChange]);

  useEffect(() => {
    const mapEventManager: EventManager | undefined = mapService.getEventManager();

    if (!mapEventManager) {
      return;
    }

    mapEventManager.add('zoomend', onZoomEnd);
    mapEventManager.add('click', onMapClick);

    return () => {
      mapEventManager.remove('zoomend', onZoomEnd as any);
      mapEventManager.remove('click', onMapClick as any);
    }
  }, [onZoomEnd, onMapClick]);

  const handleMapResize = () => {
    if (mapResizeTimeout) {
      clearTimeout(mapResizeTimeout);
    }

    mapResizeTimeout = setTimeout(() => mapService.resizeMap());
  };

  const render = () => {
    const extraElements = mapService.getLayersInfo()
      .map(layer => layer.getMapComponent && layer.getMapComponent())
      .map((componentAndProps) => {
        if (!componentAndProps) {
          return null;
        }

        const { component, props } = componentAndProps;
        return React.createElement(component, props);
      });

    return (
      <div id="mapparent">
        <ReactResizeDetector
          handleHeight
          handleWidth
          onResize={handleMapResize}
        />
        <div id={mapService.mapId}></div>

        <WarningPopover />

        {extraElements}
      </div>
    );
  };

  return render();
}

export default Map;
