import './SearchCallout.scss';

import Fuse from 'fuse.js';
import React from 'react';
import {
  Callout,
  DefaultButton,
  DirectionalHint,
  IButtonProps,
  SearchBox,
  TooltipHost,
  TooltipOverflowMode,
} from '@fluentui/react';

import NoResults from '../NoResults/NoResults';

type defaultItemRender = (props?: IButtonProps) => React.ReactNode;

export interface SearchCalloutProps<T> {
  items: T[];
  selectedItem?: T;
  target?: string | Element | MouseEvent | React.RefObject<Element>;
  searchOptions?: Fuse.IFuseOptions<T>;
  groupName?: string;
  directionalHint?: DirectionalHint;
  onItemClick?: (item: T) => void;
  onDismiss?: () => void;
  getItemText?: (item: T) => string;
  renderItem?: (item: T, defaultRender: defaultItemRender) => React.ReactNode;
}

export const SearchCallout: <T>(props: SearchCalloutProps<T>) => React.ReactElement<SearchCalloutProps<T>> | null = ({
  items,
  selectedItem,
  target,
  searchOptions,
  groupName,
  directionalHint,
  onItemClick,
  onDismiss,
  getItemText,
  renderItem,
}) => {
  const [searchValue, setSearchValue] = React.useState('');

  if (!items?.length) {
    return null;
  }

  let filteredItems = items;

  if (searchValue) {
    const fuse = new Fuse(
      items,
      searchOptions,
    );

    filteredItems = fuse.search(searchValue).map((item: Fuse.FuseResult<any>) => item.item);
  }

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!filteredItems) {
      return;
    }

    if (onItemClick) {
      onItemClick(filteredItems[0]);
    }

    setSearchValue('');
  };

  const renderDefaultItem = (item: any, props?: IButtonProps) => {
    const text = getItemText ? getItemText(item) : undefined;

    return (
      <DefaultButton
        ariaLabel={text}
        className={`item-content${selectedItem === item ? ' selected': ''}`}
        onClick={() => {
          if (onItemClick) {
            onItemClick(item);
          }

          setSearchValue('');
        }}
        {...props}
      >
        <TooltipHost
          overflowMode={TooltipOverflowMode.Self}
          hostClassName="item-text"
          content={text}
        >
          {text}
        </TooltipHost>

        {props?.children}
      </DefaultButton>
    );
  };

  const renderSearchItem = (item: any): React.ReactNode => {
    if (renderItem) {
      return renderItem(item, (props?: IButtonProps) => renderDefaultItem(item, props));
    }

    return renderDefaultItem(item);
  };

  return (
    <Callout
      target={target}
      onDismiss={onDismiss}
      isBeakVisible={false}
      directionalHint={directionalHint}
      setInitialFocus
    >
      <form
        className="search-form"
        onSubmit={onFormSubmit}
      >
        <div className="search-box-container">
          <SearchBox
            value={searchValue}
            placeholder="Search"
            disableAnimation={true}
            styles={{
              root: 'search-box'
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement> | undefined, value: string | undefined) => {
              setSearchValue(value ?? '');
            }}
            ariaLabel={`Search ${groupName ?? ''}`}
          />
        </div>

        {filteredItems.length !== 0 && (
          <ul className="items-list">
            {filteredItems.map((item) => (
              <li>
                {renderSearchItem(item)}
              </li>
            ))}
          </ul>
        )}

        {!filteredItems.length && (
          <NoResults title="Search not found. Try again"/>
        )}
      </form>
    </Callout>
  )
};
