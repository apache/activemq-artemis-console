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
import { Column } from '../table/ArtemisTable';
import { artemisService } from '../artemis-service';
import { Toolbar, ToolbarContent, ToolbarItem, Text, SearchInput, Button, PaginationVariant, Pagination, DataList, DataListCell, DataListCheck, DataListItem, DataListItemCells, DataListItemRow, Modal, TextContent, Icon, ModalVariant } from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th, Tbody, Td, ActionsColumn, IAction } from '@patternfly/react-table';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { createQueueObjectName } from '../util/jmx';
import { Link } from 'react-router-dom';
import { eventService } from '@hawtio/react';
import { QueueSelectInput } from './QueueSelect';
import { SendMessage } from './SendMessage';
import { Message } from './MessageView';

export type MessageProps = {
  address: string,
  queue: string,
  routingType: string,
  selectMessage?: Function,
  back?: Function
}



export const MessagesTable: React.FunctionComponent<MessageProps> = props => {


  const messageView = (row: any) => {
    if (props.selectMessage) { props.selectMessage(row); }
  }

  const allColumns: Column[] = [
    { id: 'messageID', name: 'Message ID', visible: true, sortable: true, filterable: true, link: messageView },
    { id: 'type', name: 'Type', visible: true, sortable: true, filterable: true },
    { id: 'durable', name: 'Durable', visible: true, sortable: true, filterable: true },
    { id: 'priority', name: 'Priority', visible: true, sortable: true, filterable: true },
    { id: 'timestamp', name: 'Timestamp', visible: true, sortable: true, filterable: true },
    { id: 'expiration', name: 'Expires', visible: true, sortable: true, filterable: true },
    { id: 'redelivered', name: 'Redelivered', visible: true, sortable: true, filterable: true },
    { id: 'largeMessage', name: 'Large', visible: true, sortable: true, filterable: true },
    { id: 'persistentSize', name: 'Persistent Size', visible: true, sortable: true, filterable: true },
    { id: 'userID', name: 'User ID', visible: false, sortable: true, filterable: false },
    { id: 'validatedUser', name: 'Validated User', visible: false, sortable: true, filterable: false },
    { id: 'originalQueue', name: 'Original Queue', visible: false, sortable: true, filterable: false },
  ];
  const [filter, setFilter] = useState("");
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([])
  const [perPage, setPerPage] = useState(10);
  const [columns, setColumns] = useState(allColumns);
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [resultsSize, setresultsSize] = useState(0);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [selectedTargetQueue, setSelectedTargetQueue] = useState<string>('');
  const [showDeleteMessagesModal, setShowDeleteMessagesModal] = useState(false);
  const [showMoveMessagesModal, setShowMoveMessagesModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [ resendMessage, setResendMessage] = useState<Message | undefined>();

  useEffect(() => {
    const listData = async () => {
      var data = await listMessages();
      setRows(data.data);
      setresultsSize(data.count);
    }
    const listMessages = async (): Promise<any> => {
      const brokerObjectname = await artemisService.getBrokerObjectName();
      const queueMBean: string = createQueueObjectName(brokerObjectname, props.address, props.routingType, props.queue);
      const response = await artemisService.getMessages(queueMBean, page, perPage, filter);
      return response;
    }
    listData();

  }, [props.address, props.routingType, props.queue, page, perPage, filter, selectedMessages])

  const handleSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
  };

  const handleColumnsModalToggle = () => {
    setColumnsModalOpen(!columnsModalOpen);
  };

  const onSearchTextChange = (newValue: string) => {
    setInputValue(newValue);
  };

  const applyFilter = () => {
    setFilter(inputValue);
  };

  const getRowActions = (row: any, rowIndex: number): IAction[] => {
    return [
      {
        title: 'Delete',
        onClick: () => {
          setSelectedMessages([row.messageID]);
          setShowDeleteMessagesModal(true);
        }
      },
      {
        title: 'View',
        onClick: () => {
          if (props.selectMessage) { props.selectMessage(row); }
        }
      },
      {
        title: 'Resend',
        onClick: () => {
          if (props.selectMessage) { 
            setResendMessage(row);
            setShowResendModal(true);
          }
        }
      }
    ]
  };

  const selectAllColumns = () => {
    const updatedColumns = [...columns]
    updatedColumns.map((column) => {
      column.visible = true;
      return true;
    })
    setColumns(updatedColumns);
  };

  const onSave = () => {
    setColumnsModalOpen(!columnsModalOpen);
  };

  const updateColumnStatus = (index: number, column: Column) => {
    const updatedColumns = [...columns];
    updatedColumns[index].visible = !columns[index].visible;
    setColumns(updatedColumns);
  }

  const onSelectMessage = (id: number, inex: number, selected: boolean) => {
    var updatedSelectedMessages: number[] = [];
    if (selected) {
      selectedMessages.forEach((id) => updatedSelectedMessages.push(id));
      updatedSelectedMessages.push(id);
      setSelectedMessages(updatedSelectedMessages)
    } else {
      updatedSelectedMessages = selectedMessages.splice(selectedMessages.indexOf(id), 1);
      selectedMessages.forEach((id) => updatedSelectedMessages.push(id));
      updatedSelectedMessages.splice(updatedSelectedMessages.indexOf(id), 1);
      setSelectedMessages(updatedSelectedMessages)
    }
  }

  const isMessageSelected = (id: number) => {
    return selectedMessages.includes(id);
  }

  const handleDeleteMessages = () => {

    const isRejected = <T,>(p: PromiseSettledResult<T>): p is PromiseRejectedResult => p.status === 'rejected';
    var results: Promise<unknown>[] = [];
    for (let i = 0; i < selectedMessages.length; i++) {
      var promise: Promise<unknown> = artemisService.deleteMessage(selectedMessages[i], props.address, props.routingType, props.queue);
      results.push(promise);
    };
    Promise.allSettled(results)
      .then((results) => {
        const rejectedReasons = results.filter(isRejected).map(p => p.reason);

        if (rejectedReasons.length > 0) {
          eventService.notify({
            type: 'warning',
            message: "not all messages deleted: errors " + rejectedReasons.toString(),
          })
        } else {
          eventService.notify({
            type: 'success',
            message: "Messages Successfully Deleted [" + selectedMessages + "]",
          })
        }
      });

    setShowDeleteMessagesModal(false);
    setSelectedMessages([]);
  }

  const handleMoveMessages = () => {

    const isRejected = <T,>(p: PromiseSettledResult<T>): p is PromiseRejectedResult => p.status === 'rejected';
    var results: Promise<unknown>[] = [];
    for (let i = 0; i < selectedMessages.length; i++) {
      var promise: Promise<unknown> = artemisService.moveMessage(selectedMessages[i], selectedTargetQueue, props.address, props.routingType, props.queue);
      results.push(promise);
    };
    Promise.allSettled(results)
      .then((results) => {
        const rejectedReasons = results.filter(isRejected).map(p => p.reason);

        if (rejectedReasons.length > 0) {
          eventService.notify({
            type: 'warning',
            message: "not all messages moved: errors " + rejectedReasons.toString(),
          })
        } else {
          eventService.notify({
            type: 'success',
            message: "Messages Successfully Moved [" + selectedMessages + "]",
          })
        }
      });

    setShowMoveMessagesModal(false);
    setSelectedMessages([]);
  }

  return (
    <React.Fragment>
      <Toolbar id="toolbar">
        <ToolbarContent>
          <ToolbarItem variant="search-filter">
            <SearchInput
              aria-label="With filters example search input"
              onChange={(_event, value) => onSearchTextChange(value)}
              value={inputValue}
              onClear={() => {
                onSearchTextChange('');
                applyFilter();
              }}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Button onClick={applyFilter}>Search</Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button onClick={() => setShowDeleteMessagesModal(true)}>Delete</Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button onClick={() => setShowMoveMessagesModal(true)}>Move</Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button variant='link' onClick={handleColumnsModalToggle}>Manage Columns</Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <TableComposable variant="compact" aria-label="Column Management Table">
        <Thead>
          <Tr >
            <Th></Th>
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
                <Td
                  select={{
                    rowIndex,
                    onSelect: (_event, isSelecting) => onSelectMessage(Number(artemisService.getKeyByValue(row, "messageID")), rowIndex, isSelecting),
                    isSelected: isMessageSelected(Number(artemisService.getKeyByValue(row, "messageID")))
                  }}
                />
                {columns.map((column, id) => {
                  if (column.visible) {
                    const text = artemisService.getKeyByValue(row, column.id);
                    if (column.link) {
                      return <Td key={id}><Link to="" onClick={() => { if (column.link) { column.link(row) } }}>{text}</Link></Td>
                    } else {
                      return <Td key={id}>{text}</Td>
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
      <Pagination
        itemCount={resultsSize}
        page={page}
        perPage={perPage}
        onSetPage={handleSetPage}
        onPerPageSelect={handlePerPageSelect}
        variant={PaginationVariant.bottom}
        titles={{
          paginationTitle: `${PaginationVariant.bottom} pagination`
        }}
      />
      {props.back &&
        <Button onClick={() => { if (props.back) { props.back(0) } }}>Queues</Button>
      }
      <Modal
        aria-label='delete-message-modal'
        variant={ModalVariant.medium}
        isOpen={showDeleteMessagesModal}
        onClose={() => setShowDeleteMessagesModal(false)}
        actions={[
          <Button key="cancel" variant="secondary" onClick={() => setShowDeleteMessagesModal(false)}>
            Cancel
          </Button>,
          <Button key="delete" variant="primary" onClick={handleDeleteMessages}>
            Confirm
          </Button>
        ]}>
        <TextContent>
          <Text component="h2">
            Confirm Delete Message(s)
          </Text>
          <Text component="p">
            <Icon isInline status='warning'>
              <ExclamationCircleIcon />
            </Icon>
            You are about to delete message(s) {selectedMessages.toString()}
          </Text>
          <Text component="p">
            This operation cannot be undone so please be careful.
          </Text>
        </TextContent>
      </Modal>
      <Modal
        aria-label='move-message-modal'
        variant={ModalVariant.medium}
        isOpen={showMoveMessagesModal}
        actions={[
          <Button key="cancel" variant="secondary" onClick={() => setShowMoveMessagesModal(false)}>
            Cancel
          </Button>,
          <Button key="move" variant="primary" onClick={handleMoveMessages}>
            Confirm
          </Button>
        ]}>
        <TextContent>
          <Text component="h2">
            Confirm Move Message(s)
          </Text>
          <Text component="p">
            <Icon isInline status='warning'>
              <ExclamationCircleIcon />
            </Icon>
            You are about to move messages {selectedMessages.toString()}
          </Text>
          <Text component="p">
            This operation cannot be undone so please be careful.
          </Text>
          <QueueSelectInput selectQueue={setSelectedTargetQueue}/>
        </TextContent>
      </Modal>
      <Modal
        title="Resend Message"
        isOpen={showResendModal}
        variant="small"
        description={''}
        onClose={() => setShowResendModal(false)}
        actions={[
          <Button key="close" variant="secondary" onClick={() => setShowResendModal(false)}>
            Cancel
          </Button>
        ]}>
          <SendMessage queue={props.queue} routingType={props.routingType} address={props.address} isAddress={false} message={resendMessage}/>
        </Modal>
      <Modal
        title="Manage columns"
        isOpen={columnsModalOpen}
        variant="small"
        description={
          <TextContent>
            <Text>Selected categories will be displayed in the table.</Text>
            <Button isInline onClick={selectAllColumns} variant="link">
              Select all
            </Button>
          </TextContent>
        }
        onClose={handleColumnsModalToggle}
        actions={[
          <Button key="save" variant="primary" onClick={onSave}>
            Save
          </Button>,
          <Button key="close" variant="secondary" onClick={handleColumnsModalToggle}>
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
    </React.Fragment>
  );
}