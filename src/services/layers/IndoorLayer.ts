import { Map } from "azure-maps-control";
import { indoor } from "azure-maps-indoor";

import { Layer, LayerType } from "./Layer";
import { LocationData, LocationType } from "../../models/locationsData";

import Legend from "../../components/Legend/Legend";
import { subscriptionKey } from "../../config";

interface NumberRule {
  color: string;
  range: {
    minimum?: number | null;
    maximum?: number | null;
    exclusiveMinimum?: number | null;
    exclusiveMaximum?: number | null;
  };
}

// There's also a boolean rule but we're not supporting it for now
type Rule = NumberRule;

interface RawStyle {
  keyName: string;
  type: string;
  rules: Rule[];
}

interface RawStyleSheet {
  statesetStyle?: null | {
    styles: RawStyle[];
  }
}

type StateColors = Record<string, string>

export class IndoorLayer implements Layer {
  private indoorManager?: indoor.IndoorManager;
  private legendItems: Record<string, string> = {};
  private statesetId?: string;
  private visible: boolean = false;

  public readonly type = LayerType.Indoor;

  constructor(
    public readonly id: string,
    public readonly name: string,
  ) { }

  public get isVisible(): boolean {
    return this.visible;
  }

  initialize(map: Map, indoorManager: indoor.IndoorManager) {
    this.indoorManager = indoorManager;
  }

  setVisibility(isVisible: boolean) {
    if (isVisible !== this.visible) {
      this.updateStateSetId(isVisible ? this.statesetId : undefined);
      this.visible = isVisible;
    }
  }

  onLayerVisibilityChange(layer: Layer) {
    if (layer.type === LayerType.Indoor && layer.isVisible) {
      this.visible = false;
    }
  }

  private updateStateSetId(statesetId: string | undefined) {
    if (!this.indoorManager) {
      return;
    }

    const facility = this.indoorManager.getCurrentFacility();
    this.indoorManager.setOptions({ statesetId });
    // Turn dynamic styling on when at least one indoor layer is visible
    this.indoorManager?.setDynamicStyling(!!statesetId);
    this.indoorManager.setFacility(...facility);
  }

  public async setLocation(data: LocationData) {
    this.statesetId = getStatesetId(data, this.id);
    if (this.visible) {
      this.updateStateSetId(this.statesetId);
    }

    if (this.statesetId) {
      try {
        this.legendItems = await fetchStateColors(this.statesetId, this.id);
      } catch (err) {
        console.error(`Failed to fetch state colors: ${err}`);
      }
    }
  }

  dispose() { }

  getMapComponent() {
    if (Object.keys(this.legendItems).length !== 0) {
      return {
        component: Legend,
        props: {
          layerId: this.id,
          title: "Temperature",
          items: this.legendItems,
        }
      };
    }
  }
}

const parseRule = (type: string, rule: Rule): [string, string] | undefined => {
  if (type === "number") {
    const { color, range } = (rule as NumberRule);
    const { minimum, exclusiveMinimum, maximum, exclusiveMaximum } = range;

    const min = minimum ?? exclusiveMinimum;
    const max = maximum ?? exclusiveMaximum;

    if (!min && !max) {
      return;
    }

    if (min && max) {
      return [color, `${min} ~ ${max}`];
    }

    if (!min) {
      return [color, `< ${max}`];
    }

    return [color, `> ${min}`];
  }

  return;
};

const cachedColors: { [id: string]: StateColors | undefined } = {};

const fetchStateColors = async (statesetId: string, layerId: string): Promise<StateColors> => {
  const key = `${statesetId}#${layerId}`;
  const cached = cachedColors[key];
  if (cached !== undefined) {
    return cached;
  }

  const baseUrl = "https://us.atlas.microsoft.com/featureState/stateset/";
  const url = baseUrl + `${statesetId}?api-version=1.0&subscription-key=${subscriptionKey}`;

  try {
    const response = await fetch(url)
    if (response.status !== 200) {
      throw new Error(`HTTP${response.status} ${response.text}`);
    }

    const rawStylesheet: RawStyleSheet = await response.json();
    const style = rawStylesheet.statesetStyle?.styles
      .find(style => style.keyName === layerId);

    if (!style) {
      return {}
    }

    const colors = style.rules.reduce<Record<string, string>>((acc, rule) => {
      const parsed = parseRule(style.type, rule);
      if (parsed) {
        const [color, text] = parsed;
        acc[color] = text;
      }
      return acc;
    }, {});

    cachedColors[key] = colors;
    return colors;
  } catch (error) {
    console.error(`Failed to fetch stateset ${statesetId}: ${error}`);
    return {}
  }
};

const getStatesetId = (location: LocationData, layerId: string): string | undefined => {
  // For floor locations return their parent's statesetId
  const loc = location.type === LocationType.Floor && location.parent ? location.parent : location;
  return loc.config?.stateSets?.find(s => s.stateSetName === layerId)?.stateSetId;
}
