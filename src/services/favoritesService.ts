import { CameraBoundsOptions, CameraOptions } from 'azure-maps-control';

import { MapPosition } from '../models/mapData';
import { mapService } from './mapService';
import { LayersVisibilityState } from '../reducers/layersData';

export interface FavoriteItem {
  locationId: string;
  position?: MapPosition;
  zoom?: number;
  bearing?: number;
  pitch?: number;
  layersVisibility?: LayersVisibilityState;
  mapStyle?: string;
};

export interface Favorites {
  [locationId: string]: FavoriteItem;
};

export class FavoritesService {
  private favorites: Favorites = FavoritesService.loadFavorites();

  private static loadFavorites(): Favorites {
    const json: string | undefined = localStorage.favorites;

    return json ? JSON.parse(json) : {};
  }

  public getFavorites = (): Favorites => this.favorites;

  public getDataById = (locationId: string): FavoriteItem | undefined => this.favorites[locationId];

  private saveFavorites() {
    localStorage.favorites = JSON.stringify(this.favorites);
  }

  private addFavoriteItem(data: FavoriteItem) {
    this.favorites[data.locationId] = data;

    this.saveFavorites();
  }

  public addToFavorites(
    locationId: string,
    isCurrentLocation: boolean,
    layersVisibility: LayersVisibilityState
  ) {
    let favoriteItem: FavoriteItem = {
      locationId,
    };
  
    if (isCurrentLocation) {
      const mapCamera: CameraOptions & CameraBoundsOptions | undefined = mapService.getCamera();
      const mapStyle: string = mapService.getCurrentMapStyle();

      favoriteItem = {
        locationId,
        layersVisibility,
        mapStyle,
      };
  
      if (mapCamera) {
        const position: number[] | undefined = mapCamera.center;
        if (position) {
          favoriteItem.position = {
            longitude: position[0],
            latitude: position[1],
          }
        }
  
        favoriteItem.zoom = mapCamera.zoom;
        favoriteItem.bearing = mapCamera.bearing;
        favoriteItem.pitch = mapCamera.pitch;
      }
    }
  
    this.addFavoriteItem(favoriteItem);
  }

  public removeFromFavorites(locationId: string) {
    if (this.isFavorite(locationId)) {
      delete this.favorites[locationId];
      this.saveFavorites();
    }
  }

  public isFavorite(locationId: string): boolean {
    return !!this.favorites[locationId];
  }
}

export const favoritesService = new FavoritesService();