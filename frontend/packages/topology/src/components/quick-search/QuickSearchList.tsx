import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { history } from '@console/internal/components/utils';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  Split,
  SplitItem,
  Label,
  TextContent,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { getIconProps } from '@console/dev-console/src/components/catalog/utils/catalog-utils';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import './QuickSearchList.scss';
import { CatalogLinkData } from './utils/quick-search-types';
import { Link } from 'react-router-dom';

interface QuickSearchListProps {
  listItems: CatalogItem[];
  viewAll?: CatalogLinkData[];
  selectedItemId: string;
  searchTerm: string;
  namespace: string;
  onSelectListItem: (itemId: string) => void;
}

const QuickSearchList: React.FC<QuickSearchListProps> = ({
  listItems,
  viewAll,
  selectedItemId,
  onSelectListItem,
}) => {
  const { t } = useTranslation();

  const handleCta = (e: React.SyntheticEvent, item: CatalogItem) => {
    e.preventDefault();
    const { href, callback } = item.cta;
    callback ? callback() : history.push(href);
  };

  const getIcon = (item: CatalogItem) => {
    const { iconImg, iconClass } = getIconProps(item);
    return (
      <img
        className="odc-quick-search-list__item-icon"
        src={iconClass ? getImageForIconClass(iconClass) : iconImg}
        alt={`${item.name} icon`}
      />
    );
  };

  return (
    <div className="odc-quick-search-list">
      <DataList
        className="odc-quick-search-list__list"
        aria-label={t('topology~Quick search list')}
        selectedDataListItemId={selectedItemId}
        onSelectDataListItem={onSelectListItem}
        isCompact
      >
        {listItems.map((item) => (
          <DataListItem
            id={item.uid}
            key={item.uid}
            tabIndex={-1}
            className={cx('odc-quick-search-list__item', {
              'odc-quick-search-list__item--highlight': item.uid === selectedItemId,
            })}
            onDoubleClick={(e: React.SyntheticEvent) => handleCta(e, item)}
          >
            <DataListItemRow className="odc-quick-search-list__item-row">
              <DataListItemCells
                className="odc-quick-search-list__item-content"
                dataListCells={[
                  <DataListCell isIcon key={`${item.uid}-icon`}>
                    {getIcon(item)}
                  </DataListCell>,
                  <DataListCell
                    style={{ paddingTop: 'var(--pf-global--spacer--sm)' }}
                    width={2}
                    wrapModifier="truncate"
                    key={`${item.uid}-name`}
                  >
                    <span className="odc-quick-search-list__item-name">{item.name}</span>
                    <Split style={{ alignItems: 'center' }} hasGutter>
                      <SplitItem>
                        <Label>{item.type}</Label>
                      </SplitItem>
                      <SplitItem>
                        <TextContent>
                          <Text component={TextVariants.small}>{item.provider}</Text>
                        </TextContent>
                      </SplitItem>
                    </Split>
                  </DataListCell>,
                ]}
              />
            </DataListItemRow>
          </DataListItem>
        ))}
      </DataList>
      <div className="odc-quick-search-list__all-items-link">
        {viewAll?.map((catalogLink) => (
          <Link
            to={catalogLink.to}
            key={catalogLink.catalogType}
            style={{ fontSize: 'var(--pf-global--FontSize--sm)' }}
          >
            {catalogLink.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickSearchList;
