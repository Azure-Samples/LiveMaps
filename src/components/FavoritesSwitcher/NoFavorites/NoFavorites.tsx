import './NoFavorites.scss';

import React from 'react';
import { Callout, DirectionalHint } from '@fluentui/react';

import NoResults from '../../NoResults/NoResults';

export interface NoFavoritesProps {
  target: string | Element | MouseEvent | React.RefObject<Element>;
  onDismiss?: () => void;
}

export const NoFavorites: React.FC<NoFavoritesProps> = ({
  target,
  onDismiss,
}) => {
    return (
      <Callout
        className="no-favorites"
        target={target}
        onDismiss={onDismiss}
        isBeakVisible={false}
        directionalHint={DirectionalHint.rightTopEdge}
        setInitialFocus
      >
        <NoResults title="No favorite locations"/>
      </Callout>
    )
};