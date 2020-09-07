import {
  data as atlasData,
  layer as atlasLayer,
  Map,
  source as atlasSource,
} from 'azure-maps-control';
import { indoor } from "azure-maps-indoor";

import { Layer, LayerType } from "./Layer";
import { LocationData } from '../../models/locationsData';

const DEFAULT_WEATHER_PHRASE: string = 'default';
const DEFAULT_WEATHER_TEMPERATURE: number = 0;

// Icon offset so that weather icon is not placed over the building
const ICON_OFFSET = 0.0005

const weatherPhrases: { [id: string]: string } = {
  'Some clouds': 'sun.rays.small.cloud.png',
  'Partly cloudy': 'sun.rays.cloud.png',
  'Mostly cloudy': 'sun.big.cloud.png',
  'Cloudy': 'cloud.png',
  'Light fog': 'cloud.fog.png',
  'Fog': 'cloud.dark.fog.png',
  'Mostly clear': 'sun.big.png',
  'Clear': 'sun.big.png',
  'Partly sunny': 'sun.rays.cloud.png',
  'Mostly sunny': 'sun.rays.small.cloud.png',
  'Sunny': 'sun.rays.small.png',
  'Clouds and sun': 'sun.big.cloud.png',
  'Hazy sunshine': 'sun.rays.cloud.png',
  'Flurries': 'sun.big.cloud.drizzle.png',
  'Light rain': 'cloud.drizzle.png',
  'Rain': 'cloud.rain.png',
  'Heavy Rain': 'cloud.dark.rain.png',
  'Light snow': 'cloud.snow.png',
  'Light snow and fog': 'cloud.snow.png',
  'Light snow shower': 'cloud.snow.png',
  'Blowing snow': 'cloud.snow.png',
  'Ice crystals': 'cloud.dark.snow.png',
  'Thunderstorm': 'cloud.dark.multiple.lightning.png',
  [DEFAULT_WEATHER_PHRASE]: 'sun.big.cloud.png',
};

export class WeatherLayer implements Layer {
  private map?: Map;
  private weatherDataSource?: atlasSource.DataSource;
  private layer?: atlasLayer.SymbolLayer;
  private layerId: string = "weather";
  private interval?: NodeJS.Timeout;
  private visible: boolean = false;
  private currentLocation?: LocationData;

  public readonly type = LayerType.Weather;

  constructor(
    public readonly id: string,
    public readonly name: string,
    private subscriptionKey: string
  ) { }

  private async getCurrentWeatherAsync() {
    if (!this.currentLocation) {
      return;
    }

    const baseUrl: string = 'https://atlas.microsoft.com/weather/currentConditions/json?';
    const lat: number = this.currentLocation.latitude;
    const lng: number = this.currentLocation.longitude;

    try {
      const response = await fetch(
        `${baseUrl}subscription-key=${this.subscriptionKey}&api-version=1.0&query=${lat},${lng}&unit=imperial`
      );

      if (!response.ok) {
        throw Error();
      }

      const json = await response.json();
      const results = json?.results;
      if (!results?.length || !results[0]) {
        throw Error();
      }

      const currentWeather = results[0];

      const phrase = currentWeather.phrase ?? DEFAULT_WEATHER_PHRASE;
      const temperature = currentWeather.temperature?.value ?? DEFAULT_WEATHER_TEMPERATURE;
      this.updateWeatherLayer(phrase, temperature);
    } catch (error) { }
  }

  private async updateWeatherLayer(phrase: string, temperature: string) {
    if (!this.layer || !this.currentLocation) {
      return;
    }

    this.layer.setOptions({ iconOptions: { image: phrase } });

    const weatherTag: string = weatherPhrases[phrase];
    if (!this.map!.imageSprite.hasImage(weatherTag)) {
      const img = `${process.env.PUBLIC_URL}/static/images/weather/${weatherTag}`;
      try {
        await this.map!.imageSprite.add(phrase, img)
      } catch (error) {
        return;
      }
    }

    this.weatherDataSource!.clear();

    // Create a point feature and add it to the data source.
    const { longitude, latitude } = this.currentLocation;
    this.weatherDataSource!.add(
      new atlasData.Feature(
        new atlasData.Point([longitude - ICON_OFFSET, latitude + ICON_OFFSET/2]),
        { temperature }
      )
    );
  }

  initialize(map: Map, indoorManager: indoor.IndoorManager) {
    this.map = map;

    //Create a data source and add it to the map.
    this.weatherDataSource = new atlasSource.DataSource();
    this.map.sources.add(this.weatherDataSource);

    //Add a layer for rendering point data as symbols.
    this.layer = new atlasLayer.SymbolLayer(
      this.weatherDataSource,
      this.layerId,
      {
        iconOptions: {
          //Pass in the id of the custom icon that was loaded into the map resources.
          image: DEFAULT_WEATHER_PHRASE,

          //Optionally scale the size of the icon.
          size: 0.6,
        },
        textOptions: {
          //Convert the temperature property of each feature into a string and concatenate "°F".
          textField: ['concat', ['to-string', ['get', 'temperature']], '°F'],

          //Offset the text so that it appears on top of the icon.
          offset: [0, -2],
        },
        minZoom: 18.5,
      }
    );
  }

  public get isVisible(): boolean {
    return this.visible;
  }

  setVisibility(isVisible: boolean) {
    if (!this.map || !this.layer) {
      return;
    }

    if (isVisible === this.visible) {
      return;
    }

    this.visible = isVisible;

    if (isVisible) {
      this.getCurrentWeatherAsync();
      this.interval = setInterval(
        () => this.getCurrentWeatherAsync(),
        360000
      );

      this.map.layers.add(this.layer);
    } else {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = undefined;
      }

      if (this.map.layers.getLayerById(this.layerId)) {
        this.map.layers.remove(this.layerId);
      }
    }
  }

  setLocation(location: LocationData) {
    this.currentLocation = location;
    if (this.visible) {
      this.getCurrentWeatherAsync()
    }
  }

  dispose() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
