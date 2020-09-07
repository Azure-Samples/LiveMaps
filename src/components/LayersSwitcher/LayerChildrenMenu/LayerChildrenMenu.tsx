import React, { useState, useEffect } from "react";
import {
  IconButton,
  IContextualMenuItem,
  IContextualMenuListProps,
  IRenderFunction,
  SearchBox,
} from "@fluentui/react";
import Fuse from 'fuse.js';

import { Layer, LayerChildItem } from "../../../services/layers/Layer";

import "./LayerChildrenMenu.scss";

interface LayerChildrenMenuProps {
  layer: Layer;
  disabled?: boolean
}

export const LayerChildrenMenu: React.FC<LayerChildrenMenuProps> = ({ layer, disabled }) => {
  const [checkedItems, setCheckedItems] = useState<{ [name: string]: boolean }>({});
  const [searchValue, setSearchValue] = useState("");
  const [layerChildren, setlayerChildren] = useState<LayerChildItem[]>([]);

  useEffect(() => {
    if (layer.getChildren === undefined) {
      return;
    }

    const interval = setInterval(() => setlayerChildren(layer.getChildren!()), 500);
    return () => clearInterval(interval);
  }, [layer]);

  if (!layer.getChildren) {
    return null;
  }

  const searchOptions = {
    findAllMatches: true,
    keys: ["name"],
  };

  let foundItems = layerChildren;
  if (searchValue !== "") {
    foundItems = new Fuse(layerChildren, searchOptions)
      .search(searchValue).map(({ item }) => item);
  }

  const menuItems: IContextualMenuItem[] = foundItems
    .map(({ id, name, visible }) => ({
      key: id,
      name,
      canCheck: true,
      checked: visible,
      onClick: (ev, item) => {
        ev?.preventDefault();
        if (item) {
          const visible = !item.checked;
          setCheckedItems({ ...checkedItems, [item.key]: visible });
          if (layer.setChildVisibility) {
            layer.setChildVisibility(item.key, visible);
          }
        }
      },
    }));

  const itemsPlural = layer.name.toLowerCase();

  const renderMenuList: IRenderFunction<IContextualMenuListProps> = (props, defaultRender) => {
    return (
      <div className="layerchildren-callout">
        <div className="layerchildren-search" >
          <SearchBox
            className="layerchildren-input"
            ariaLabel={`Filter ${itemsPlural} by name`}
            placeholder="Search"
            onAbort={() => setSearchValue("")}
            onChange={(e: any, newValue?: string) => setSearchValue(newValue ?? "")}
          />
        </div>
        {defaultRender && defaultRender(props)}
      </div>
    );
  }

  return (
    <IconButton
      disabled={disabled || menuItems.length === 0}
      title={`Select ${itemsPlural}`}
      styles={{ root: "layers-switcher-morechildren" }}
      iconProps={{ iconName: 'More' }}
      menuProps={{
        items: menuItems,
        onRenderMenuList: renderMenuList,
      }}
    />
  );
}
