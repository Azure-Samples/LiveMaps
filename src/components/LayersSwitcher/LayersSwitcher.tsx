import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Callout, DirectionalHint } from '@fluentui/react';

import { LayerChildrenMenu } from "./LayerChildrenMenu/LayerChildrenMenu";
import { Switch } from "./Switch/Switch";

import {
  LayersVisibilityState,
  selectLayersVisibility,
  setLayerVisibility,
} from '../../reducers/layersData';

import { mapService } from '../../services/mapService';

import "./LayersSwitcher.scss";

export interface LayerSwitcherProps {
  target: string | Element | MouseEvent | React.RefObject<Element>;
  onDismiss?: () => void;
}

export const LayersSwitcher: React.FC<LayerSwitcherProps> = ({ target, onDismiss }) => {
  const dispatch = useDispatch();
  const layersVisibility: LayersVisibilityState = useSelector(selectLayersVisibility);

  return (
    <Callout
      target={target}
      onDismiss={onDismiss}
      isBeakVisible={false}
      directionalHint={DirectionalHint.rightBottomEdge}
      setInitialFocus
    >
      <div className="layers-switcher">
        {
          mapService.getLayersInfo().map((layer) => {
            const { id, name } = layer;
            return <Switch
              name={name}
              isVisible={layersVisibility[id]}
              onSetVisibility={isVisible => dispatch(setLayerVisibility({ id, isVisible }))}
            >
              {layer.getChildren && <LayerChildrenMenu layer={layer} disabled={!layersVisibility[id]}/>}
            </Switch>
          })
        }
      </div>
    </Callout>
  );
}
