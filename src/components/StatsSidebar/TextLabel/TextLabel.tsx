import './TextLabel.scss';

import React from 'react';
import { Text } from '@fluentui/react';

export interface TextLabelProps {
  label: string
  value?: string | number,
}

export const TextLabel: React.FC<TextLabelProps> = ({ label, value }) => {
  if (label.trim() === '') {
    return null;
  }

  return (
    <div className="stats-item">
      <Text className="label" contentEditable={false}>
        {label}
      </Text>

      {value && (
        <Text className="value">{value}</Text>
      )}
    </div>
  );
};
