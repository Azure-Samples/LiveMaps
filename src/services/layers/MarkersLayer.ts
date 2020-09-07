import AnimationController from 'css-animation-sync';
import { HtmlMarker, Map } from 'azure-maps-control';
import { indoor } from 'azure-maps-indoor';
import { Dispatch } from '@reduxjs/toolkit';
import { getId } from '@fluentui/react';

import { Layer, LayerType } from './Layer';
import { LocationData, LocationType } from '../../models/locationsData';
import { hidePopover, showPopover } from '../../reducers/popover';
import { PopoverType } from '../../models/popoversData';
import { MarkerData } from '../../models/mapData';
import { getZoomByLocationType } from '../../utils/locationsUtils';

export class MarkersLayer implements Layer {
  public readonly type = LayerType.Markers;
  private map?: Map;
  private data: MarkerData[] = [];
  private visible: boolean = false;
  private dispatch?: Dispatch<any>;
  private animation?: AnimationController;
  private isMarkersVisible: boolean = false;
  private readonly minZoom: number = getZoomByLocationType(LocationType.Floor);
  private markers: HtmlMarker[] = [];

  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  public get isVisible(): boolean {
    return this.visible;
  }

  initialize(map: Map, indoorManager: indoor.IndoorManager, dispatch: Dispatch<any>) {
    this.map = map;
    this.dispatch = dispatch;
  }

  setVisibility(isVisible: boolean) {
    if (!this.map || this.isVisible === isVisible) {
      return;
    }

    this.visible = isVisible;
    this.updateMarkers();
  }

  setLocation(location: LocationData) {}

  dispose() {
    this.removeAnimation();
  }

  updateData(data: MarkerData[]) {
    this.data = data;

    if (this.isVisible) {
      this.updateMarkers();
    }
  }

  private shouldMarkersBeVisible() {
    if (!this.map || !this.isVisible) {
      return false;
    }

    const currentZoom: number | undefined = this.map.getCamera().zoom;
    return currentZoom ? currentZoom >= this.minZoom : false;
  }

  private updateMarkersVisibility = () => {
    if (!this.map) {
      return;
    }

    const isVisible = this.shouldMarkersBeVisible() && this.markers.length > 1;

    if (isVisible === this.isMarkersVisible) {
      return;
    }

    this.isMarkersVisible = isVisible;

    this.markers.forEach((marker: HtmlMarker) => marker.setOptions({ visible: isVisible }));
  }

  private removeAnimation() {
    if (this.animation) {
      this.animation?.free();
      this.animation = undefined;
    }
  }

  private removeMarkers() {
    if (this.map) {
      this.markers.forEach((marker: HtmlMarker) => this.map!.markers.remove(marker));
    }
  }

  private updateMarkers() {
    this.removeMarkers();
    this.removeAnimation();
    this.map?.events.remove('zoom', this.updateMarkersVisibility);
    this.isMarkersVisible = false;

    if (!this.map || !this.isVisible) {
      return;
    }

    const isMarkersVisible = this.shouldMarkersBeVisible();
    this.data.forEach((markerData: MarkerData) => {
      this.createMarker(markerData, isMarkersVisible);
    });

    if (this.markers.length > 0) {
      this.isMarkersVisible = isMarkersVisible;
      this.animation = new AnimationController('pulse');
      this.map?.events.add('zoom', this.updateMarkersVisibility);
    }
  }

  private createMarker(data: MarkerData, isVisible: boolean) {
    if (!this.map || !data.position) {
      return;
    }

    const id: string = getId(`${this.id}-marker`);

    const htmlMarker: HtmlMarker = new HtmlMarker({
      htmlContent: `<div id=${id} class="pulseIcon"></div>`,
      position: [data.position.longitude, data.position.latitude],
      visible: isVisible,
    });

    this.map.markers.add(htmlMarker);
    this.markers.push(htmlMarker);

    const marker = document.getElementById(id);

    if (!marker) {
      return;
    }

    marker.onmouseover = () => this.dispatch!(showPopover({
      type: PopoverType.Warning,
      isVisible: true,
      target: `#${id}`,
      title: data.title,
      description: data.description,
    }));

    marker.onmouseleave = () => this.dispatch!(hidePopover(PopoverType.Warning));
  }
}
