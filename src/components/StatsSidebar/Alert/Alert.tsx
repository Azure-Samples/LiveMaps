import './Alert.scss';

import React from 'react';
import { Icon, Link, Text } from '@fluentui/react';

export interface AlertProps {
  label: string
  url?: string;
  iconName?: string,
  iconColor?: string;
}

export const Alert: React.FC<AlertProps> = ({ label, url, iconName, iconColor }) => {
  if (label.trim() === '') {
    return null;
  }

  return (
    <div className="alert-item">
      {iconName && (
        <Icon
          iconName={iconName}
          className="icon"
          ariaLabel="Warning icon"
          style={{
            color: iconColor
          }}
          contentEditable={false}
        />
      )}

      {url && (
        <Link
          className="link"
          href={url}
          target="_blank"
          contentEditable={false}
        >
          {label}
        </Link>
      )}

      {!url && (
        <Text className="label" contentEditable={false}>
          {label}
        </Text>
      )}
    </div>
  );
};
