import { HtmlMarker, Map, Popup, TargetedEvent } from 'azure-maps-control';

import { Layer, LayerType, LayerChildItem } from './Layer';
import { LocationData, LocationType } from '../../models/locationsData';
import { TrackerData } from '../../models/mapData';
import { getZoomByLocationType } from '../../utils/locationsUtils';

const WS_STATE_CLOSED = 3;

interface MarkerInfo {
  name: string;
  marker: HtmlMarker;
  visible: boolean;
}

const isHtmlMarker = (t: HtmlMarker | Popup | undefined): t is HtmlMarker => !!(t && (t as HtmlMarker).togglePopup);
const showMarkerPopup = (e: TargetedEvent) => isHtmlMarker(e.target) && e.target.getOptions().popup?.open();
const hideMarkerPopup = (e: TargetedEvent) => isHtmlMarker(e.target) && e.target.getOptions().popup?.close();

export class TrackingLayer implements Layer {
  public readonly type = LayerType.Tracking;

  private map?: Map;
  private visible: boolean = false;
  private markers: Record<string, MarkerInfo | undefined> = {};
  private locationId?: string;

  private readonly minZoom: number;

  /**
   * This property controls whether markers are rendered - this is not the same
   * as `visible` property of the layer itself or `markerInfo.visible` which is
   * used to control visibility of a particular marker and removes it from
   * markers collection. For example the layer can be turned on (visible = true)
   * and all markers are toggled on as well (marker.visible = true) but tme map
   * is zoomed out so we need to hide markers temporarily without affecting
   * layer/marker visibility controls.
   */
  private areMarkersVisible: boolean = false;

  private transitionsDisabled = false;

  private ws: WebSocket | undefined;

  constructor(
    public readonly id: string,
    public readonly name: string,
    private options: {
      dataUrl: string,
      trackerUrl: string,
      iconName?: string;
      /**
       * Type of location at which layer should be visible
       */
      layerLocationType?: LocationType;
    }
  ) {
    if (!this.options.iconName) {
      this.options.iconName = "Location";
    }
    if (!this.options.layerLocationType) {
      this.options.layerLocationType = LocationType.Floor;
    }

    this.minZoom = getZoomByLocationType(options.layerLocationType!);
  }

  private getLocationId(loc: LocationData): string | undefined {
    const { layerLocationType } = this.options;

    let location: LocationData | undefined = loc;
    while (location && location.type !== layerLocationType) {
      location = location.parent;
    }

    return location?.id;
  }

  public get isVisible(): boolean {
    return this.visible;
  }

  private disableMarkerTransitions = () => {
    if (!this.visible) {
      return;
    }

    this.transitionsDisabled = true;

    Object.values(this.markers)
      .forEach((info) => {
        if (!info || !info.visible) {
          return;
        }
        const { marker } = info;
        ((marker as any).element as HTMLElement).style.transition = "";
        const { popup } = marker.getOptions();
        if (popup) {
          ((popup as any).containerDiv as HTMLElement).style.transition = "";
        }
      });
  }

  private enableMarkerTransitions = () => {
    if (!this.visible) {
      return;
    }

    Object.values(this.markers)
      .forEach((info) => {
        if (!info || !info.visible) {
          return;
        }
        const { marker } = info;
        ((marker as any).element as HTMLElement).style.transition = "transform 1s linear";
        const { popup } = marker.getOptions();
        if (popup) {
          ((popup as any).containerDiv as HTMLElement).style.transition = "transform 1s linear";
        }
      });

    this.transitionsDisabled = false;
  }

  private handleMarkersVisibility = () => {
    if (!this.isVisible) {
      return;
    }

    const shouldBeVisible = this.shouldMarkersBeVisible(this.map!);
    if (shouldBeVisible === this.areMarkersVisible) {
      return;
    }

    this.areMarkersVisible = shouldBeVisible;
    Object.values(this.markers).forEach(info => {
      const { marker } = info!;
      marker.setOptions({ visible: shouldBeVisible });
    });
  }

  initialize(map: Map) {
    this.map = map;

    map.events.add("movestart", this.disableMarkerTransitions);
    map.events.add("zoomstart", this.disableMarkerTransitions);
    map.events.add("moveend", this.enableMarkerTransitions);
    map.events.add("zoomend", this.enableMarkerTransitions);
    map.events.add("zoom", this.handleMarkersVisibility);
  }

  setVisibility(isVisible: boolean) {
    if (this.isVisible === isVisible) {
      return;
    }

    this.visible = isVisible;
    if (!this.map) {
      return;
    }

    if (!isVisible) {
      this.stopTracking();
      return
    }

    this.areMarkersVisible = this.shouldMarkersBeVisible(this.map);
    this.startTracking();
  }

  async setLocation(location: LocationData): Promise<void> {
    const locationId = this.getLocationId(location);
    if (locationId === undefined || locationId === this.locationId) {
      return;
    }

    this.stopTracking();

    this.locationId = locationId

    this.startTracking();
  }

  dispose() {
    this.stopTracking();
    this.map?.events.remove("movestart", this.disableMarkerTransitions);
    this.map?.events.remove("zoomstart", this.disableMarkerTransitions);
    this.map?.events.remove("moveend", this.enableMarkerTransitions);
    this.map?.events.remove("zoomend", this.enableMarkerTransitions);
    this.map?.events.remove("zoom", this.handleMarkersVisibility);
  }

  private shouldMarkersBeVisible(map: Map) {
    const currentZoom = map.getCamera().zoom;
    return currentZoom ? currentZoom >= this.minZoom : false;
  }

  private updateMarker(markerId: string, data: TrackerData) {
    if (!this.markers[markerId]) {
      this.createMarker(data);
      return;
    }

    const { position: rawPosition } = data;
    if (rawPosition) {
      const { marker } = this.markers[markerId]!;
      const { longitude, latitude } = rawPosition;

      const position = [longitude, latitude];
      marker.setOptions({ position });
      marker.getOptions().popup?.setOptions({ position });
    }
  }

  private createMarker(data: TrackerData): void {
    if (!this.map || !data.position) {
      return;
    }

    const position = [data.position.longitude, data.position.latitude];

    try {
      const popup = new Popup({
        closeButton: false,
        content: `<div class="trackerIcon-popup">${data.name}</div>`,
        pixelOffset: [0, -24],
        showPointer: false,
        position,
      });
      popup.attach(this.map);
      if (!this.transitionsDisabled) {
        ((popup as any).containerDiv as HTMLElement).style.transition = "transform 1s linear";
      }

      const marker = new HtmlMarker({
        text: data.name,
        htmlContent: `<i class="trackerIcon ms-Icon ms-Icon--${this.options.iconName}"></i>`,
        position,
        popup,
        visible: this.areMarkersVisible,
      });

      if (!this.transitionsDisabled) {
        // HACK: element property is private so we have to use this double cast
        ((marker as any).element as HTMLElement).style.transition = "transform 1s linear";
      }

      this.map.markers.add(marker);
      this.map.events.add("mouseenter", marker, showMarkerPopup);
      this.map.events.add("mouseleave", marker, hideMarkerPopup);

      this.markers[data.id] = { name: data.name, marker, visible: true };
    } catch (error) {
      console.error(error);
    }
  }

  private startTracking() {
    if (!this.isVisible) {
      return;
    }

    // First stop current tracking session as we may have another socket already opened
    this.stopTracking();

    this.ws = new WebSocket(`${this.options.trackerUrl}/${this.locationId}`);
    this.ws.onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        (data as TrackerData[]).forEach(d => this.updateMarker(d.id, d));
      } catch (error) {
        console.warn("Couldn't parse marker data update");
      }
    };

    this.ws.onclose = e => {
      if (e.wasClean) {
        console.log(`Connection closed by server: ${e.code}: ${e.reason}`);
      } else {
        console.warn(`Connection interrupted`);
      }
    };

    this.ws.onerror = err => console.error(`Connection error: ${err}`);
  }

  private stopTracking() {
    if (this.ws) {
      if (this.ws.readyState !== WS_STATE_CLOSED) {
        this.ws.close();
      }

      delete this.ws;
    }


    Object.values(this.markers).forEach((markerInfo) => {
      if (!this.map) {
        return;
      }

      const { marker } = markerInfo!;
      this.map.markers.remove(marker);
      this.map.events.remove("mouseenter", marker, showMarkerPopup);
      this.map.events.remove("mouseleave", marker, hideMarkerPopup);
    });

    this.markers = {};
  }

  public getChildren(): LayerChildItem[] {
    if (!this.locationId) {
      return [];
    }

    return Object.entries(this.markers)
      .map(([id, marker]) => {
        const { name, visible } = marker!;
        return { id, name, visible };
      });
  }

  public setChildVisibility(id: string, isVisible: boolean) {
    const item = this.markers[id];
    if (!this.map || !item) {
      return;
    }

    item.visible = isVisible;
    if (isVisible) {
      this.map.markers.add(item.marker);
    } else {
      // Close popup if it's displaying
      item.marker.getOptions().popup?.close();
      this.map.markers.remove(item.marker);
    }
  }
}
