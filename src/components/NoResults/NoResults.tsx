import './NoResults.scss';

import React from 'react';

export interface NoResultsProps {
  title: string;
}

const NoResults: React.FC<NoResultsProps> = ({
  title,
}) => {
  return (
    <div className="search-no-result">
      <p className="title">
        {title}
      </p>

      <img
        src="/static/images/empty-search.svg"
        alt="No search result image"
        role="presentation"
        aria-hidden={true}
      />
    </div>
  );
};

export default NoResults;
