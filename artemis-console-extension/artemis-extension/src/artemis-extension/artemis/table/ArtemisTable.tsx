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
  OptionsMenu,
  OptionsMenuToggle,
  Pagination,
  PaginationVariant,
  Text,
  TextContent,
  Select,
  SelectVariant,
  OptionsMenuItemGroup,
  OptionsMenuItem,
  OptionsMenuSeparator,
  SelectOption,
  SearchInput,
  SelectOptionObject
} from '@patternfly/react-core';
import SortAmountDownIcon from '@patternfly/react-icons/dist/esm/icons/sort-amount-down-icon';
import { TableComposable, Thead, Tr, Th, Tbody, Td, IAction, ActionsColumn } from '@patternfly/react-table';
import { artemisPreferencesService } from '../artemis-preferences-service';

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
    { id: 'EQUALS', name: 'Equals' },
    { id: 'CONTAINS', name: 'Contains' },
    { id: 'NOT_CONTAINS', name: 'Does Not Contain' },
    { id: 'GREATER_THAN', name: 'Greater Than' },
    { id: 'LESS_THAN', name: 'Less Than' }
  ]

  const initialActiveSort: ActiveSort = {
    id: broker.allColumns[0].id,
    order: SortDirection.ASCENDING
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
  const initialFilter: Filter = {
    column: columns[0].id,
    operation: operationOptions[0].id,
    input: ''
  }
  const [filter, setFilter] = useState(broker.filter !== undefined? broker.filter:initialFilter);

  const [filterColumnStatusSelected, setFilterColumnStatusSelected] = useState(columns.find(column => filter.column === column.id)?.name);
  const [filterColumnOperationSelected, setFilterColumnOperationSelected] = useState(operationOptions.find(operation => operation.id === filter.operation)?.name);
  const [inputValue, setInputValue] = useState(filter.input);
  const [filterColumnStatusIsExpanded, setFilterColumnStatusIsExpanded] = useState(false);
  const [filterColumnOperationIsExpanded, setFilterColumnOperationIsExpanded] = useState(false);


  useEffect(() => {
    const listData = async () => {
      var data = await broker.getData(page, perPage, activeSort, filter);
      setRows(data.data);
      setresultsSize(data.count);
    }
    if (!columnsLoaded && broker.storageColumnLocation) {
      const updatedColumns: Column[] = artemisPreferencesService.loadColumnPreferences(broker.storageColumnLocation, broker.allColumns);
      setColumns(updatedColumns);
      setColumnsLoaded(true);
    }
    listData();

  }, [columns, page, activeSort, filter, perPage, columnsLoaded, broker])

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const onFilterColumnStatusToggle = (isExpanded: boolean) => {
    setFilterColumnStatusIsExpanded(isExpanded);
  };

  const onFilterColumnOperationToggle = (isExpanded: boolean) => {
    setFilterColumnOperationIsExpanded(isExpanded);
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
  }

  const onFilterColumnStatusSelect = (
    _event: React.MouseEvent | React.ChangeEvent,
    selection: string | SelectOptionObject
  ) => {
    setFilterColumnStatusSelected(selection as string);
    setFilterColumnStatusIsExpanded(false);
  };

  const onFilterColumnOperationSelect = (
    _event: React.MouseEvent | React.ChangeEvent,
    selection: string | SelectOptionObject
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
    setPerPage(newPerPage);
  };

  const getKeyByValue = (producer: never, columnName: string) => {
    return producer[columnName];
  }

  const applyFilter = () => {
    const operation = operationOptions.find(operation => operation.name === filterColumnOperationSelected);
    const column = columns.find(column => column.name === filterColumnStatusSelected);
    if (operation && column) {
      setFilter({ column: column.id, operation: operation.id, input: inputValue });
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
        paginationTitle: `${variant} pagination`
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
            <Text>Selected categories will be displayed in the table.</Text>
            <Button isInline onClick={selectAllColumns} variant="link">
              Select all
            </Button>
          </TextContent>
        }
        onClose={handleModalToggle}
        actions={[
          <Button key="save" variant="primary" onClick={onSave}>
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
                  {Object.values(broker.allColumns).map((column, columnIndex) => (
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
              variant={SelectVariant.single}
              aria-label="Select Input"
              onToggle={onFilterColumnStatusToggle}
              onSelect={onFilterColumnStatusSelect}
              selections={filterColumnStatusSelected}
              isOpen={filterColumnStatusIsExpanded}
            >
              {columns.map((column, index) => (
                <SelectOption key={column.id} value={column.name} />
              ))}
            </Select>
          </ToolbarItem>
          <ToolbarItem variant="search-filter" key="filter-type">
            <Select
              variant={SelectVariant.single}
              aria-label="Select Input"
              onToggle={onFilterColumnOperationToggle}
              onSelect={onFilterColumnOperationSelect}
              selections={filterColumnOperationSelected}
              isOpen={filterColumnOperationIsExpanded}
            >
              {operationOptions.map((column, index) => (
                <SelectOption key={column.id} value={column.name} />
              ))}
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
            />
          </ToolbarItem>
          <ToolbarItem key="search-button">
            <Button onClick={applyFilter}>Search</Button>
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
      <TableComposable variant="compact" aria-label="Column Management Table">
        <Thead>
          <Tr >
            {columns.map((column, id) => {
              if (column.visible) {
                return <Th key={id}>{column.name}</Th>
              } else return ''
            }
            )}
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, rowIndex) => (
            <Tr key={rowIndex}>
              <>
                {columns.map((column, id) => {
                  if (column.visible) {
                    var key = getKeyByValue(row, column.id)
                    if(column.filter) {
                      var filter = column.filter(row);
                      return <Td key={id}><Link to="" onClick={() => {if (broker.navigate) { broker.navigate(column.filterTab, filter)}}}>{key}</Link></Td>
                    } else if (column.link) {
                      return <Td key={id}><Link to="" onClick={() => {if (column.link) {column.link(row)}}}>{key}</Link></Td>
                    } else {
                      return <Td key={id}>{key}</Td>
                    }
                  } else return ''
                }
                )}
                <td>
                  <ActionsColumn
                    items={getRowActions(row, rowIndex)}
                  />
                </td>
              </>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
      {renderPagination(PaginationVariant.bottom)}
      {renderModal()}
    </React.Fragment>
  );
};


