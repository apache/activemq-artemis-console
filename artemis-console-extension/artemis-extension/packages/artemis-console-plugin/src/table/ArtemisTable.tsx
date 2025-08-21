/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  DataList,
  DataListCheck,
  DataListItem,
  DataListItemRow,
  DataListCell,
  DataListItemCells,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Modal,
  Pagination,
  PaginationVariant,
  Text,
  TextContent,
  Select,
  SelectOption,
  SearchInput,
  MenuToggleElement,
  MenuToggle,
  SelectList
} from '@patternfly/react-core';
import { SortAmountDownIcon } from '@patternfly/react-icons/dist/esm/icons/sort-amount-down-icon';
import { Thead, Tr, Th, Tbody, Td, IAction, ActionsColumn, Table, InnerScrollContainer } from '@patternfly/react-table';
import { artemisPreferencesService } from '../artemis-preferences-service';
import {
  OptionsMenu,
  OptionsMenuItem,
  OptionsMenuItemGroup,
  OptionsMenuSeparator, OptionsMenuToggle
} from '@patternfly/react-core/deprecated'

export type Column = {
  id: string
  name: string
  visible: boolean
  sortable: boolean
  filterable: boolean
  filter?: Function
  filterTab?: number
  link?: Function
}

export enum SortDirection {
  ASCENDING = 'asc',
  DESCENDING = 'desc'
}

export type ActiveSort = {
  id: string
  order: SortDirection
}

export type Filter = {
  column: string
  operation: string
  input: string
}

export type ToolbarAction = {
  name: string
  action: Function
}

export type TableData = {
  allColumns: Column[],
  getData: Function,
  getRowActions?: Function,
  toolbarActions?: ToolbarAction[],
  loadData?: number,
  storageColumnLocation?: string
  navigate?: Function
  filter?: Filter
}

export const ArtemisTable: React.FunctionComponent<TableData> = broker => {

const operationOptions = [
    { id: 'CONTAINS', name: 'Contains' },
    { id: 'NOT_CONTAINS', name: 'Does Not Contain' },
    { id: 'EQUALS', name: 'Equals' },
    { id: 'GREATER_THAN', name: 'Greater Than' },
    { id: 'LESS_THAN', name: 'Less Than' }
  ]
  
  const initialActiveSort = () => {
    if (broker.storageColumnLocation && sessionStorage.getItem(broker.storageColumnLocation + '.activesort')) {
      return JSON.parse(sessionStorage.getItem(broker.storageColumnLocation + '.activesort') as string);
    }
    return {
      id: broker.allColumns[0].id,
      order: SortDirection.ASCENDING
    };
  }

  const [rows, setRows] = useState([])
  const [resultsSize, setresultsSize] = useState(0)
  const [columnsLoaded, setColumnsLoaded] = useState(false);

  const [columns, setColumns] = useState(broker.allColumns);
  const [activeSort, setActiveSort] = useState(initialActiveSort);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const initialFilter = () =>  {
    if (broker.storageColumnLocation && sessionStorage.getItem(broker.storageColumnLocation + '.filter')) {
      return JSON.parse(sessionStorage.getItem(broker.storageColumnLocation + '.filter') as string);
    }
    return { 
      column: columns[1].id,
      operation: operationOptions[0].id,
      input: ''
    }
  }

  const [filter, setFilter] = useState(() => broker.filter !== undefined ? broker.filter : initialFilter());

  const [filterColumnStatusSelected, setFilterColumnStatusSelected] = useState(columns.find(column => filter.column === column.id)?.name);
  const [filterColumnOperationSelected, setFilterColumnOperationSelected] = useState(operationOptions.find(operation => operation.id === filter.operation)?.name);
  const [inputValue, setInputValue] = useState(filter.input);
  const [filterColumnStatusIsExpanded, setFilterColumnStatusIsExpanded] = useState(false);
  const [filterColumnOperationIsExpanded, setFilterColumnOperationIsExpanded] = useState(false);

  const listData = async () => {
    const data = await broker.getData(page, perPage, activeSort, filter);
    setRows(data.data);
    setresultsSize(data.count);
  };

  useEffect(() => {
    if (!columnsLoaded && broker.storageColumnLocation) {
      const updatedColumns: Column[] = artemisPreferencesService.loadColumnPreferences(broker.storageColumnLocation, broker.allColumns);
      setColumns(updatedColumns);
      setColumnsLoaded(true);
    }
  }, [columns, columnsLoaded]);

  useEffect(() => {
    listData();
  }, [page, perPage, activeSort, filter]);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const onSave = () => {
    setIsModalOpen(!isModalOpen);

    if (broker.storageColumnLocation) {
      artemisPreferencesService.saveColumnPreferences(broker.storageColumnLocation, columns);
    }
  };

  const selectAllColumns = () => {
    const updatedColumns = [...columns]
    updatedColumns.map((column) => {
      column.visible = true;
      return true;
    })
    setColumns(updatedColumns);
  };

  const unselectAllColumns = () => {
    const updatedColumns = [...columns]
    updatedColumns.map((column) => {
      column.visible = false;
      return false;
    })
    setColumns(updatedColumns);
  };

  const onSearchTextChange = (newValue: string) => {
    setInputValue(newValue);
  };

  const updateColumnStatus = (index: number, column: Column) => {
    const updatedColumns = [...columns];
    updatedColumns[index].visible = !columns[index].visible;
    setColumns(updatedColumns);
  }

  const updateActiveSort = (id: string, order: SortDirection) => {
    const updatedActiveSort: ActiveSort = {
      id: id,
      order: order
    };
    setActiveSort(updatedActiveSort)
    sessionStorage.setItem(broker.storageColumnLocation + ".activesort",JSON.stringify(updatedActiveSort));
  }

  const onFilterColumnStatusSelect = (
    _event?: React.MouseEvent<Element, MouseEvent> | undefined,
    selection?: string | number | undefined
  ) => {
    setFilterColumnStatusSelected(selection as string);
    setFilterColumnStatusIsExpanded(false);
  };

  const onFilterColumnOperationSelect = (
    _event?: React.MouseEvent<Element, MouseEvent> | undefined,
    selection?: string | number | undefined
  ) => {
    const operation = operationOptions.find(operation => operation.name === selection);
    if (operation) {
      setFilterColumnOperationSelected(selection as string);
    }
    setFilterColumnOperationIsExpanded(false);
  };

  const getRowActions = (row: never, rowIndex: number): IAction[] => {
    if (broker.getRowActions) {
      return broker.getRowActions(row, rowIndex);
    }
    return [];
  };

  const handleSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number, newPage: number) => {
    if(broker.storageColumnLocation) {
      artemisPreferencesService.saveTablePageSize(broker.storageColumnLocation, newPerPage)
    }
    setPage(1);
    setPerPage(newPerPage);
  };

  const getKeyByValue = (producer: never, columnName: string) => {
    return producer[columnName];
  }

  const applyFilter = () => {
    setPage(1);
    const operation = operationOptions.find(operation => operation.name === filterColumnOperationSelected);
    const column = columns.find(column => column.name === filterColumnStatusSelected);
    if (operation && column) {
      var filter = { column: column.id, operation: operation.id, input: inputValue };
      setFilter(filter);
      if (broker.storageColumnLocation) {
        sessionStorage.setItem(broker.storageColumnLocation + '.filter', JSON.stringify(filter));
      }
    }
  }

  const renderPagination = (variant: PaginationVariant | undefined) => (
    <Pagination
      itemCount={resultsSize}
      page={page}
      perPage={perPage}
      onSetPage={handleSetPage}
      onPerPageSelect={handlePerPageSelect}
      variant={variant}
      titles={{
        paginationAriaLabel: `${variant} pagination`
      }}
    />
  );
  const renderModal = () => {
    return (
      <Modal
        title="Manage columns"
        isOpen={isModalOpen}
        variant="small"
        description={
          <TextContent>
            <Text>Selected categories are displayed in the table.</Text>
            <Button isInline onClick={selectAllColumns} variant="link">
              Select all
            </Button>{ ' | ' }
            <Button isInline onClick={unselectAllColumns} variant="link">
              Unselect all
            </Button>
          </TextContent>
        }
        onClose={handleModalToggle}
        actions={[
          <Button id='columns-save-button' key="save" variant="primary" onClick={onSave}>
            Save
          </Button>,
          <Button key="close" variant="secondary" onClick={handleModalToggle}>
            Cancel
          </Button>
        ]}
      >
        <DataList aria-label="Table column management" id="table-column-management" isCompact>
          {columns.map((column, id) => (
            <DataListItem key={`table-column-management-${column.id}`} aria-labelledby={`table-column-management-${column.id}`}>
              <DataListItemRow>
                <DataListCheck
                  aria-labelledby={`table-column-management-item-${column.id}`}
                  checked={column.visible}
                  name={`check-${column.id}`}
                  id={`check-${column.id}`}
                  onChange={checked => updateColumnStatus(id, column)}
                />
                <DataListItemCells
                  dataListCells={[
                    <DataListCell id={`table-column-management-item-${column.id}`} key={`table-column-management-item-${column.id}`}>
                      <label htmlFor={`check-${column.id}`}>{column.name}</label>
                    </DataListCell>
                  ]}
                />
              </DataListItemRow>
            </DataListItem>
          ))}
        </DataList>
      </Modal>
    );
  };


  const toolbarItems = (
    <React.Fragment>
      <Toolbar id="toolbar">
        <ToolbarContent>
          <ToolbarItem key='address-sort'>
            <OptionsMenu
              id="options-menu-multiple-options-example"
              menuItems={[
                <OptionsMenuItemGroup key="first group" aria-label="Sort column">
                  {Object.values(broker.allColumns).filter((element) => element.visible).map((column, columnIndex) => (
                    <OptionsMenuItem
                      key={column.id}
                      isSelected={activeSort.id === column.id}
                      onSelect={() => {
                        updateActiveSort(column.id, activeSort.order)
                      }}
                    >
                      {column.name}
                    </OptionsMenuItem>
                  ))}
                </OptionsMenuItemGroup>,
                <OptionsMenuSeparator key="separator" />,
                <OptionsMenuItemGroup key="second group" aria-label="Sort direction">
                  <OptionsMenuItem
                    onSelect={() => updateActiveSort(activeSort.id, SortDirection.ASCENDING)}
                    isSelected={activeSort.order === SortDirection.ASCENDING}
                    id="ascending"
                    key="ascending"
                  >
                    Ascending
                  </OptionsMenuItem>
                  <OptionsMenuItem
                    onSelect={() => updateActiveSort(activeSort.id, SortDirection.DESCENDING)}
                    isSelected={activeSort.order === SortDirection.DESCENDING}
                    id="descending"
                    key="descending"
                  >
                    Descending
                  </OptionsMenuItem>
                </OptionsMenuItemGroup>
              ]}
              isOpen={isSortDropdownOpen}
              toggle={
                <OptionsMenuToggle
                  hideCaret
                  onToggle={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  toggleTemplate={<SortAmountDownIcon />}
                />
              }
              isPlain
              isGrouped
            />
          </ToolbarItem>
          <ToolbarItem variant="search-filter" key='column-id-select'>
            <Select
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle isFullWidth role='menu' ref={toggleRef} onClick={() => setFilterColumnStatusIsExpanded(prev => !prev)}>
                    {filterColumnStatusSelected}
                  </MenuToggle>
              )}
              aria-label="Select Input"
              onSelect={onFilterColumnStatusSelect}
              selected={filterColumnStatusSelected}
              isOpen={filterColumnStatusIsExpanded}
              onOpenChange={(isOpen: boolean) => setFilterColumnStatusIsExpanded(isOpen)}
            >
              <SelectList>
                {columns.filter((element) => element.visible).map((column, index) => (
                  <SelectOption key={column.id} value={column.name}>{column.name}</SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarItem>
          <ToolbarItem variant="search-filter" key="filter-type">
            <Select
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle isFullWidth role='menu' ref={toggleRef} onClick={() => setFilterColumnOperationIsExpanded(prev => !prev)}>
                    {filterColumnOperationSelected}
                  </MenuToggle>
              )}
              aria-label="Select Input"
              onSelect={onFilterColumnOperationSelect}
              selected={filterColumnOperationSelected}
              isOpen={filterColumnOperationIsExpanded}
              onOpenChange={(isOpen: boolean) => setFilterColumnOperationIsExpanded(isOpen)}
            >
              <SelectList>
                {operationOptions.map((column, _index) => (
                    <SelectOption key={column.id} value={column.name}>{column.name}</SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarItem>
          <ToolbarItem variant="search-filter" key="search=text">
            <SearchInput
              aria-label="search-text"
              onChange={(_event, value) => onSearchTextChange(value)}
              value={inputValue}
              onClear={() => {
                onSearchTextChange('');
                applyFilter();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilter();
                }
              }}
            />
          </ToolbarItem>
          <ToolbarItem key="search-button">
            <Button onClick={applyFilter} id="table-search-button">Search</Button>
          </ToolbarItem>
          <ToolbarItem key="column-select">
            <Button variant='link' onClick={handleModalToggle}>Manage Columns</Button>
          </ToolbarItem>
          {
            broker.toolbarActions?.map(action => (
              <ToolbarItem key={"toolbar-action-" + action.name}>
                <Button variant='link' onClick={() => action.action()}>{action.name}</Button>
              </ToolbarItem>))
          }
        </ToolbarContent>
      </Toolbar>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      {toolbarItems}
      <InnerScrollContainer>
      <Table variant="compact" aria-label="Data Table" id='data-table'>
      <Thead>
        <Tr>
          {columns.map((column, id) => {
            if (!column.visible) return null;

            const isSorted = column.id === activeSort.id;
            const direction = isSorted ? activeSort.order : undefined;
            const nextDirection =
              isSorted && activeSort.order === SortDirection.ASCENDING
                ? SortDirection.DESCENDING
                : SortDirection.ASCENDING;
            return (
              <Th
                key={id}
                sort={{
                  sortBy: {
                    index: id,
                    direction: direction === SortDirection.ASCENDING ? 'asc' : 'desc'
                  },
                  onSort: () => updateActiveSort(column.id, nextDirection),
                  columnIndex: id
                }}
              >{column.name}</Th>
            );
          })}
        </Tr>
      </Thead>
        <Tbody>
          {rows.map((row, rowIndex) => (
            <Tr key={rowIndex}>
              <>
               {columns.filter((column) => column.visible).map((column, id) => {
                  const key = getKeyByValue(row, column.id)
                  if(column.filter) {
                    const filter = column.filter(row);
                    return <Td key={id}><Link to="" onClick={() => {if (broker.navigate) { broker.navigate(column.filterTab, filter)}}}>{key}</Link></Td>
                  } else if (column.link) {
                    return <Td key={id}><Link to="" onClick={() => {if (column.link) column.link(row)}}>{key}</Link></Td>
                  } else {
                    return <Td key={id}>{key}</Td>
                  }
                })}
                <Td isActionCell>
                  <ActionsColumn
                    items={getRowActions(row, rowIndex)}
                    popperProps={{ position: 'right', appendTo: () => (document.getElementById('root') as HTMLElement) }}
                  />
                </Td>
              </>
            </Tr>
          ))}
        </Tbody>
      </Table>
      </InnerScrollContainer>
      {renderPagination(PaginationVariant.bottom)}
      {renderModal()}
    </React.Fragment>
  );
};


