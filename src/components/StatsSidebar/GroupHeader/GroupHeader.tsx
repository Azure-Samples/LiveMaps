import './GroupHeader.scss';

import React from 'react';
import { DefaultButton as Button, Icon, IGroupHeaderProps, Text } from '@fluentui/react';

export interface GroupHeaderProps extends IGroupHeaderProps {
  color?: string;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({ group, onToggleCollapse, color }) => {
  if (!group) {
    return null;
  }

  const { isCollapsed, name } = group;
  const className = `collapse-icon${isCollapsed ? " collapsed" : ""}`;
  const ariaLabel = `${isCollapsed ? "Expand" : "Colapse"} ${name} group`;

  return (
    <Button
      ariaLabel={ariaLabel}
      className="stats-header"
      styles={{ flexContainer: "flex-container" }}
      onClick={() => onToggleCollapse!(group)}
    >
      <Text className="label" style={{ color: color }}>
        {name}
      </Text>

      <Icon iconName="CaretSolidDown" className={className} />
    </Button>
  );
}
