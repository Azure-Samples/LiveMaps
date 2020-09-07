import * as turf from '@turf/helpers';
import getCenter from '@turf/center';
import {
  AnimationOptions,
  CameraBoundsOptions,
  CameraOptions,
  control,
  ControlPosition,
  ControlStyle,
  data as atlasData,
  EventManager,
  Map,
  MapEvent,
  math as atlasMath,
} from 'azure-maps-control';
import { indoor } from 'azure-maps-indoor';
import { Dispatch } from '@reduxjs/toolkit';

import { subscriptionKey, trackerHostname } from '../config';
import { LocationData, LocationType } from '../models/locationsData';
import {
  getLocationFacilityId,
  getLocationTilesetId,
  getMaxDistanceByLocationType,
  getZoomByLocationType,
  INVALID_FLOOR_NUMBER,
} from '../utils/locationsUtils';
import { IndoorLayer } from './layers/IndoorLayer';
import { WeatherLayer } from './layers/WeatherLayer';
import { Layer } from './layers/Layer';
import { WarningsLayer } from './layers/WarningsLayer';
import { WarningData, WarningsByLocation } from '../models/warningsData';
import { FavoriteItem, favoritesService } from './favoritesService';
import { MapObject, MapPosition } from '../models/mapData';
import { MarkersLayer } from './layers/MarkersLayer';
import { TrackingLayer } from './layers/TrackingLayer';
import { getLayerWarnings } from '../utils/warningsUtils';
import { FloorsLayer } from './layers/FloorsLayer';
import { Navigator } from './layers/Navigator';
import { RoomsByFloorId } from '../models/roomsData';

export const LayerId = {
  FieldWorkers: 'field_workers',
  Floors: 'floors',
  Occupancy: 'occupancy',
  Security: 'security',
  Shuttles: 'shuttles',
  Temperature: 'temperature',
  Warnings: 'warnings',
  Weather: 'weather',
}

const DEFAULT_MAP_STYLE = 'road';

interface MapServiceOptions {
  layers: Layer[];
}

type LayersById = { [id: string]: Layer };

class MapService {
  public readonly mapId: string = 'map-id';
  public readonly flyDuration: number = 1000;
  private map?: Map;
  private indoorManager?: indoor.IndoorManager;
  private isReady: boolean = false;
  private currentLocation?: LocationData;
  private navigator?: Navigator;

  private layers: LayersById;

  constructor(options: MapServiceOptions) {
    this.layers = options.layers.reduce<LayersById>((acc, layer) => {
      acc[layer.id] = layer;
      return acc;
    }, {});
  }

  public initialize(onReady: (map: Map) => void, dispatch: Dispatch<any>) {
    this.map = new Map(this.mapId, { subscriptionKey });
    this.indoorManager = new indoor.IndoorManager(this.map, {});

    this.map.events.add("ready", (e: MapEvent) => {
      // Initialize all layers
      Object.values(this.layers).forEach(layer => layer.initialize(this.map!, this.indoorManager!, dispatch));

      //Create a zoom control.
      this.map!.controls.add(
        new control.ZoomControl({
          zoomDelta: 0.5,
          style: ControlStyle.light
        }),
        {
          position: ControlPosition.BottomRight,
        }
      );

      //Create a pitch control and add it to the map.
      this.map!.controls.add(
        new control.PitchControl({
          pitchDegreesDelta: 5,
          style: ControlStyle.light,
        }),
        {
          position: ControlPosition.BottomLeft,
        }
      );

      //Create a compass control and add it to the map.
      this.map!.controls.add(
        new control.CompassControl({
          rotationDegreesDelta: 5,
          style: ControlStyle.light,
        }),
        {
          position: ControlPosition.BottomLeft,
        }
      );

      //Add a style control to the map.
      this.map!.controls.add(
        new control.StyleControl({
          //To add all available styles, you can use the 'all' keyword.
          mapStyles: [
            'road',
            'road_shaded_relief',
            'grayscale_light',
            'grayscale_dark',
            'night',
            'satellite',
            'satellite_road_labels',
            'high_contrast_dark'
          ],
        }),
        {
          position: ControlPosition.BottomRight,
        }
      );

      this.navigator = new Navigator(e.map);
      this.isReady = true;

      this.changeLocation(this.currentLocation);
      onReady(e.map);
    });
  };

  public getCurrentMapStyle(): string {
    return this.map?.getStyle().style ?? DEFAULT_MAP_STYLE;
  }

  public changeLocation(location?: LocationData) {
    this.currentLocation = location;

    if (!location || !this.isReady) {
      return;
    }

    const favoriteData: FavoriteItem | undefined = favoritesService.getDataById(location.id);
    this.flyTo(location, favoriteData);

    if (this.indoorManager) {
      const tilesetId = getLocationTilesetId(location);
      this.indoorManager.setOptions({ tilesetId });

      const facilityId = getLocationFacilityId(location);
      const floorNumber: number = location?.ordinalNumber ?? INVALID_FLOOR_NUMBER;
      if (facilityId && floorNumber >= 0) {
        this.indoorManager.setFacility(facilityId, floorNumber);
      }
    }

    Object.values(this.layers).forEach(layer => layer.setLocation(location));
  }

  public flyTo(location?: LocationData, favoriteData?: FavoriteItem | undefined) {
    if (!this.isReady || !location) {
      return;
    }

    if (this.isLocationVisible(location) && !favoriteData) {
      return;
    }

    this.navigator?.clear();

    const favoritePosition: MapPosition | undefined = favoriteData?.position;

    let cameraOptions: CameraOptions & AnimationOptions = {
      type: "fly",
      center: [
        (favoritePosition ?? location).longitude,
        (favoritePosition ?? location).latitude,
      ],
      zoom: favoriteData?.zoom ?? getZoomByLocationType(location.type),
    };

    if (favoriteData) {
      cameraOptions.bearing = favoriteData.bearing;
      cameraOptions.pitch = favoriteData.pitch;
    }

    this.map!.setCamera(cameraOptions);

    if (favoriteData?.mapStyle) {
      this.setMapStyle(favoriteData.mapStyle);
    }
  }

  public showObject(object: MapObject) {
    if (!this.isReady) {
      return;
    }

    if (object.polygon) {
      const polygon = turf.polygon([object.polygon]);
      const center = getCenter(polygon).geometry?.coordinates;

      this.map!.setCamera({
        type: 'fly',
        center,
      });

      this.navigator!.showObject(object, this.flyDuration);
    }
  }

  public setMapStyle(style: string) {
    if (!this.isReady || this.getCurrentMapStyle() === style) {
      return;
    }

    this.map!.setStyle({ style });
  }

  public isLocationVisible(location: LocationData): boolean {
    if (!this.isReady) {
      return false;
    }

    const currentCamera = this.getCamera();

    if (!currentCamera?.zoom) {
      return false;
    }

    const locationZoom: number = getZoomByLocationType(location.type);
    const zoomDifference: number = currentCamera.zoom - locationZoom;

    const distance: number | undefined = this.getCurrentDistance(location, currentCamera);

    if (!distance) {
      return false;
    }

    return (
      zoomDifference >= 0 && zoomDifference <= 1.4
      && distance <= getMaxDistanceByLocationType(location.type)
    );
  }

  public getCurrentDistance(
    location: LocationData,
    camera?: CameraOptions & CameraBoundsOptions,
  ): number | undefined {
    if (!this.isReady) {
      return;
    }

    const currentCamera = camera ?? this.getCamera();

    if (!currentCamera?.center) {
      return;
    }

    const distance: number = atlasMath.getDistanceTo(
      new atlasData.Position(currentCamera.center[0], currentCamera.center[1]),
      new atlasData.Position(location.longitude, location.latitude)
    );

    return distance;
  }

  public setLayerVisibility(layerId: string, isVisible: boolean) {
    if (!this.indoorManager || !this.layers[layerId]) {
      return;
    }

    const updatedLayer = this.layers[layerId];
    updatedLayer.setVisibility(isVisible);
    Object.values(this.layers).forEach(layer => {
      // Do not call on the layer which visibility we're changing
      if (layer !== updatedLayer && layer.onLayerVisibilityChange) {
        layer.onLayerVisibilityChange(updatedLayer);
      }
    });
  }

  public resizeMap(): void {
    if (this.isReady) {
      this.map!.resize();
    }
  }

  public updateWarningsData(data: WarningsByLocation) {
    if (!this.currentLocation) {
      return;
    }

    const securityLayer: MarkersLayer = this.layers[LayerId.Security] as MarkersLayer;
    const securityWarnings: WarningData[] = getLayerWarnings(data, LayerId.Security, this.currentLocation.id);

    securityLayer.updateData(securityWarnings);

    const warningsLayer: WarningsLayer = this.layers[LayerId.Warnings] as WarningsLayer;
    warningsLayer.updateWarningsData(data);
  }

  public updateRoomsData(roomsByFloorId: RoomsByFloorId) {
    const warningsLayer: WarningsLayer = this.layers[LayerId.Warnings] as WarningsLayer;
    warningsLayer.updateRoomsData(roomsByFloorId);
  }

  public getEventManager(): EventManager | undefined {
    return this.map?.events;
  }

  public getFeatures(position?: atlasData.Position) {
    return this.map?.layers.getRenderedShapes(position, 'indoor') ?? [];
  }

  public getCamera() {
    return this.map?.getCamera();
  }

  public getLayersInfo() {
    return Object.values(this.layers);
  }

  public isLayerVisible(layerId: string): boolean {
    return this.layers[layerId]?.isVisible ?? false;
  }

  public dispose() {
    if (!this.isReady) {
      return;
    }

    this.isReady = false;

    this.navigator!.dispose();
    Object.values(this.layers).forEach(layer => layer.dispose());
    this.map!.dispose();
    this.map = undefined;
  }
}

const isSecure = window.location.protocol === "https:";
const wsScheme = isSecure ? "wss:" : "ws:";
const httpScheme = window.location.protocol;

export const mapService: MapService = new MapService({
  layers: [
    new IndoorLayer(LayerId.Temperature, 'Temperature'),
    new IndoorLayer(LayerId.Occupancy, 'Occupancy'),
    new WeatherLayer(LayerId.Weather, 'Weather', subscriptionKey),
    new MarkersLayer(LayerId.Security, 'Security'),
    new WarningsLayer(LayerId.Warnings, 'Warnings'),
    new TrackingLayer(LayerId.FieldWorkers, "Field workers", {
      dataUrl: `${httpScheme}//${trackerHostname}/field`,
      trackerUrl: `${wsScheme}//${trackerHostname}/field_tracker`,
      iconName: "Running",
    }),
    new TrackingLayer(LayerId.Shuttles, "Campus shuttles", {
      dataUrl: `${httpScheme}//${trackerHostname}/shuttle`,
      trackerUrl: `${wsScheme}//${trackerHostname}/shuttle_tracker`,
      iconName: "Bus",
      layerLocationType: LocationType.Campus,
    }),
    new FloorsLayer(LayerId.Floors, '3D'),
  ],
});
