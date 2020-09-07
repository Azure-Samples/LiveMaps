import {
  data as atlasData,
  layer as atlasLayer,
  Map,
  source as atlasSource,
} from 'azure-maps-control';

import { MapObject } from '../../models/mapData';

const DEFAULT_DURATION: number = 5000;

export class Navigator {
  private readonly dataSource: atlasSource.DataSource;
  private layers: atlasLayer.Layer[] = [];
  private animationTimeout?: NodeJS.Timeout;
  private animationInterval?: NodeJS.Timeout;
  private opacity: number = 0.6;
  private mapObject?: MapObject;

  constructor(private readonly map: Map) {
    this.dataSource = new atlasSource.DataSource();
    this.map.sources.add(this.dataSource);
  }

  public showObject(mapObject: MapObject, delay: number = 0, duration?: number) {
    this.clear();

    this.mapObject = mapObject;

    if (delay > 0) {
      this.animationTimeout = setTimeout(() => {
        this.createLayer(mapObject, duration);
      }, delay);
    } else {
      this.createLayer(mapObject, duration);
    }
  }

  private createLayer(mapObject: MapObject, animationDuration?: number) {
    if (!mapObject.polygon) {
      return;
    }

    const layer = new atlasLayer.PolygonLayer(
      this.dataSource,
      undefined,
      {
        fillOpacity: this.opacity,
      }
    );

    const lineLayer = new atlasLayer.LineLayer(
      this.dataSource,
      undefined,
      {
        strokeOpacity: this.opacity === 0 ? 0 : 1,
        strokeWidth: 4,
      }
    );

    this.layers.push(layer);
    this.layers.push(lineLayer);
    this.map.layers.add(this.layers);

    const positions: atlasData.Position[] = mapObject.polygon.map(
      (position) => new atlasData.Position(position[0], position[1])
    );

    this.dataSource.add(new atlasData.Polygon(positions));
    this.addAnimation(animationDuration);
  }

  private addAnimation(duration: number = DEFAULT_DURATION) {
    if (!this.layers.length) {
      return;
    }

    if (this.mapObject?.polygon) {
      this.animationInterval = setInterval(() => {
        this.opacity = this.opacity === 0 ? 0.6 : 0;

          (this.layers[0] as atlasLayer.PolygonLayer)?.setOptions({
            fillOpacity: this.opacity,
          });

          (this.layers[1] as atlasLayer.LineLayer)?.setOptions({
            strokeOpacity: this.opacity === 0 ? 0 : 1,
          })
      }, 500);

      this.animationTimeout = setTimeout(
        () => this.clear(),
        duration
      );
    }
  }

  public clear() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = undefined;
    }

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }

    this.layers.forEach((layer: atlasLayer.Layer) => {
      this.map.layers.remove(layer.getId());
    });
    this.layers = [];

    this.mapObject = undefined;
    this.dataSource.clear();
  }

  public dispose() {
    this.clear();
    this.dataSource.dispose();
  }
}