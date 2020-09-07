import * as turf from '@turf/helpers';
import transformScale from '@turf/transform-scale';
import { data as atlasData, layer as atlasLayer, Map, source as atlasSource } from 'azure-maps-control';

import { buildingPolygon } from '../../mockData/buildingData';
import { getZoomByLocationType } from '../../utils/locationsUtils';
import { LocationData, LocationType } from '../../models/locationsData';
import { Layer, LayerType } from './Layer';

const getOffsetByFloorNumber = (
  floorNumber: number,
  bearing: number = 0,
  pitch: number = 0
) => [pitch / 1000000 * 7 * floorNumber, pitch / 1000000 * 4 * floorNumber];

export class FloorsLayer implements Layer {
  public readonly type: LayerType = LayerType.Floors;

  private polygonData: [number, number][] = buildingPolygon;
  private map?: Map;
  private dataSources: atlasSource.DataSource[] = [];
  private layers: atlasLayer.PolygonLayer[] = [];
  private isLayerOn: boolean = false;
  private location?: LocationData;

  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  get isVisible() {
    return this.isLayerOn;
  }

  initialize(map: Map) {
    this.map = map;
    this.update();
  }

  setVisibility(isVisible: boolean) {
    if (this.isLayerOn === isVisible) {
      return;
    }

    this.isLayerOn = isVisible;
    this.update();
  }

  setLocation(currentLocation: LocationData) {
    const newLocation = currentLocation.parent;

    if (this.location?.id === newLocation?.id) {
      return;
    }

    this.location = newLocation;

    if (this.isVisible) {
      this.update();
    }
  }

  update() {
    if (!this.map) {
      return;
    }

    this.removeLayers();

    if (!this.isVisible || this.location?.type !== LocationType.Building) {
      return;
    }

    const floorCount: number = this.location.items?.length ?? 0;

    if (floorCount < 1) {
      return;
    }

    const minZoom: number = getZoomByLocationType(LocationType.Floor);

    for (let ordinalNumber = 0; ordinalNumber < floorCount; ordinalNumber++) {
      const dataSource = new atlasSource.DataSource();
      this.dataSources.push(dataSource);
      this.map.sources.add(dataSource);

      const layer = new atlasLayer.PolygonLayer(
        dataSource,
        undefined,
        {
          fillColor: 'gray',
          minZoom,
          fillOpacity: 0.5,
        }
      );

      this.layers.push(layer);
      this.map.layers.add(layer);
    }

    this.updateCoordinates();

    this.map.events.add('pitch', this.updateCoordinates);
  }

  private removeLayers() {
    if (!this.map || !this.dataSources.length) {
      return;
    }

    this.map.events.remove('pitch', this.updateCoordinates);
    this.map.layers.remove(this.layers);
    this.map.sources.remove(this.dataSources);
    this.dataSources.forEach(dataSource => {
      dataSource.clear();
      dataSource.dispose();
    });

    this.dataSources = [];
    this.layers = [];
  }

  private updateCoordinates = () => {
    if (!this.map || !this.dataSources.length) {
      return;
    }

    const camera = this.map.getCamera();

    const polygon = turf.polygon([this.polygonData]);

    for (let ordinalNumber = 0; ordinalNumber < this.dataSources.length; ordinalNumber++) {
      const rotatedPolygon = transformScale(polygon, 1 + ordinalNumber * 0.16);
      const offset = getOffsetByFloorNumber(ordinalNumber, camera.bearing, camera.pitch);
      this.dataSources[ordinalNumber].clear();
      this.dataSources[ordinalNumber]?.add(new atlasData.Polygon(
        rotatedPolygon.geometry!.coordinates[0].map((position) => new atlasData.Position(
          position[0] + offset[0], position[1] + offset[1])
        )
      ));
    }
  }

  dispose() {
    this.removeLayers();
  }
}
