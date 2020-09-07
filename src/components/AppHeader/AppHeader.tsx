import './AppHeader.scss';

import React from 'react';

import LocationBreadcrumb from '../LocationBreadcrumb/LocationBreadcrumb';
import MSLogo from '../MSLogo/MSLogo';
import UserControl from '../UserControl';

const AppHeader: React.FC = () => {
  return (
    <header className="app-header">
      <MSLogo />

      <LocationBreadcrumb />

      <UserControl />
    </header>
  );
};

export default AppHeader;

