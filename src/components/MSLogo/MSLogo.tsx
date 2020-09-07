import './MSLogo.scss';

import React from 'react';
import { Link } from '@fluentui/react';

const MSLogo: React.FC = () => {
  return (
    <Link
      href="/"
      aria-label="Microsoft"
      className="ms-link"
    >
      <img
        className="ms-logo"
        src="/static/images/microsoft-logo.png"
        alt="logo"
        role="presentation"
        aria-hidden={true}
      />
    </Link>
  );
};

export default MSLogo;

