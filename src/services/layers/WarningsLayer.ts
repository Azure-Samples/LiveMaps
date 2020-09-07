import {
  data as atlasData,
  layer as atlasLayer,
  LineLayerOptions,
  Map,
  PolygonLayerOptions,
  source as atlasSource,
} from 'azure-maps-control';
import { indoor } from 'azure-maps-indoor';

import { Layer, LayerType } from './Layer';
import { LocationData, LocationType } from '../../models/locationsData';
import { WarningData, WarningsByLayers, WarningsByLocation, WarningsByRooms } from '../../models/warningsData';
import { getZoomByLocationType } from '../../utils/locationsUtils';
import { RoomsByFloorId } from '../../models/roomsData';
import { Polygon } from '../../models/mapData';

enum LayerLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
};

interface LayerSettings extends PolygonLayerOptions, LineLayerOptions  {
  maxWarningsCount: number;
};

type LayersSettings = {[layerLevel: string]: LayerSettings};

const MAX_OPACITY = 0.45;
const ANIMATION_DURATION = 3000;

const layersSettings: LayersSettings = {
  [LayerLevel.Low]: {
    maxWarningsCount: 1,
    fillColor: '#FFCC00',
    strokeColor: '#FFBA00',
  },
  [LayerLevel.Medium]: {
    maxWarningsCount: 2,
    fillColor: '#FF8800',
    strokeColor: '#FF7700',
  },
  [LayerLevel.High]: {
    maxWarningsCount: Infinity,
    fillColor: '#FF0000',
    strokeColor: '#DD0000',
  },
};

const getLayerLevel = (warningsCount: number): LayerLevel => {
  for (const layerLevel in layersSettings) {
    if (warningsCount <= layersSettings[layerLevel].maxWarningsCount) {
      return layerLevel as LayerLevel;
    }
  }

  return LayerLevel.High;
}

export class WarningsLayer implements Layer {
  public type = LayerType.Warnings;
  private map?: Map;
  private data: WarningsByLocation = {};
  private roomsByFloorId: RoomsByFloorId = {};
  private isLayerOn: boolean = false;
  private currentLocation?: LocationData;
  private indoorLayerId?: string;
  private dataSources: {[layerLevel: string]: atlasSource.DataSource} = {};
  private layers: {[layerLevel: string]: [atlasLayer.PolygonLayer, atlasLayer.LineLayer]} = {};
  private animationInterval?: NodeJS.Timeout;
  private warningsOpacity: number = MAX_OPACITY;

  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  public get isVisible(): boolean {
    return this.isLayerOn;
  }

  private get isWarningsVisible(): boolean {
    return this.isLayerOn && !!this.indoorLayerId;
  }

  initialize(map: Map, indoorManager: indoor.IndoorManager) {
    this.map = map;

    const minZoom: number = getZoomByLocationType(LocationType.Floor);

    for (const layerLevel in layersSettings) {
      const dataSource = new atlasSource.DataSource();
      this.dataSources[layerLevel] = dataSource;
      this.map.sources.add(dataSource);

      const { fillColor, strokeColor} = layersSettings[layerLevel];

      this.layers[layerLevel] = [
        new atlasLayer.PolygonLayer(
          dataSource,
          undefined,
          {
            fillColor,
            minZoom,
            fillOpacity: this.warningsOpacity,
          }
        ),
        new atlasLayer.LineLayer(
          dataSource,
          undefined,
          {
            strokeColor,
            strokeWidth: 2,
            strokeOpacity: 1,
            minZoom,
          }
        )
      ];

      this.map.layers.add(this.layers[layerLevel]);
    };
  }

  setVisibility(isVisible: boolean) {
    if (!this.map) {
      return;
    }

    this.isLayerOn = isVisible;
    this.updateWarnings();
  }

  onLayerVisibilityChange(layer: Layer) {
    if (layer.type === LayerType.Indoor && layer.isVisible) {
      this.indoorLayerId = layer.id;
      this.updateWarnings();
    }
  }

  setLocation(location: LocationData) {
    this.currentLocation = location;
  }

  dispose() {
    this.removeAnimation();
  }

  updateWarningsData(data: WarningsByLocation) {
    this.data = data;

    if (this.isLayerOn) {
      this.updateWarnings();
    }
  }

  updateRoomsData(roomsByFloorId: RoomsByFloorId) {
    this.roomsByFloorId = roomsByFloorId;

    if (this.isLayerOn) {
      this.updateWarnings();
    }
  }

  private removeAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
      this.setLayersOpacity(MAX_OPACITY);
    }
  }

  private removeWarnings() {
    for (const layerLevel in this.dataSources) {
      this.dataSources[layerLevel].clear();
    }
  }

  private updateWarnings() {
    this.removeWarnings();
    this.removeAnimation();

    if (!this.map || !this.currentLocation || !this.isWarningsVisible) {
      return;
    }

    const floorId: string = this.currentLocation.id;
    const locationWarnings: WarningsByRooms | undefined = this.data[floorId];
    const roomsData = this.roomsByFloorId[floorId];

    if (!locationWarnings || !roomsData) {
      return;
    }

    for (const roomId in locationWarnings) {
      const roomWarnings: WarningsByLayers | undefined = locationWarnings[roomId];

      if (!roomWarnings) {
        continue;
      }

      const warnings: WarningData[] | undefined = roomWarnings[this.indoorLayerId!];
      const warningPolygon: Polygon | undefined = roomsData[roomId]?.polygon;

      if (!warnings?.length || !warningPolygon) {
        continue;
      }

      this.createWarning(warningPolygon, warnings.length);
    }

    this.animationInterval = setInterval(() => {
      this.setLayersOpacity(this.warningsOpacity ? 0 : MAX_OPACITY);
    }, ANIMATION_DURATION / 2);
  }

  private setLayersOpacity(opacity: number) {
    if (this.warningsOpacity === opacity) {
      return;
    }

    this.warningsOpacity = opacity;

    for (const layerLevel in this.layers) {
      this.layers[layerLevel][0].setOptions({
        fillOpacity: opacity,
      });

      this.layers[layerLevel][1].setOptions({
        strokeOpacity: opacity > 0 ? 1 : 0,
      });
    }
  }

  private createWarning(polygon: Polygon, count: number) {
    if (!this.map) {
      return;
    }

    const layerLevel: LayerLevel = getLayerLevel(count);

    const positions: atlasData.Position[] = polygon.map(
      (position) => new atlasData.Position(position[0], position[1])
    );

    this.dataSources[layerLevel].add(new atlasData.Polygon(positions));
  }
}
