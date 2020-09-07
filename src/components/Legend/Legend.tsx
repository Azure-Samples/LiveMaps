import React from 'react';
import { useSelector } from 'react-redux';

import { getZoomByLocationType } from '../../utils/locationsUtils';
import { LocationType } from '../../models/locationsData';
import { selectLayerVisibility } from '../../reducers/layersData';
import { selectMapZoomLevel } from '../../reducers/map';

import './Legend.scss';

const DEFAULT_ZOOM_THRESHOLD = getZoomByLocationType(LocationType.Floor);

interface LegendProps {
  layerId: string
  title: string;
  items: Record<string, string>;
  zoomThreshold?: number;
}

const Legend: React.FC<LegendProps> = ({
  layerId,
  title,
  items,
  zoomThreshold = DEFAULT_ZOOM_THRESHOLD,
}) => {
  const zoomLevel = useSelector(selectMapZoomLevel);
  const isLayerVisible = useSelector(selectLayerVisibility(layerId));

  const isLegendVisible = isLayerVisible && zoomLevel && zoomLevel >= zoomThreshold;
  if (!isLegendVisible) {
    return null;
  }

  return (
    <div className="legend-outer">
      <div className='my-legend'>
        <div className='legend-title'>
          {title}
        </div>

        <div className='legend-scale'>
          <ul className='legend-labels'>
            {
              Object.entries(items).map(([color, text]) => <li>
                <span style={{ backgroundColor: color }}></span>
                {text}
              </li>
              )
            }
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Legend;
