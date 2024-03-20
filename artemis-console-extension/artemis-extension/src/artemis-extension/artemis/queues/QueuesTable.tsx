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
import React, { useContext, useState } from 'react'
import { ActiveSort, ArtemisTable, Column, Filter } from '../table/ArtemisTable';
import { artemisService } from '../artemis-service';
import { IAction } from '@patternfly/react-table';
import { Button, Modal, ModalVariant } from '@patternfly/react-core';
import { SendMessage } from '../messages/SendMessage';
import { Attributes, eventService, Operations } from '@hawtio/react';
import { QueueNavigate } from './QueuesView.js';
import { ArtemisContext } from '../context';
import { createQueueObjectName } from '../util/jmx';
import { useNavigate } from 'react-router-dom';

export const QueuesTable: React.FunctionComponent<QueueNavigate> = navigate => {
  const getAddressFilter = (row: any) => {
    var filter: Filter = {
      column: 'name',
      operation: 'EQUALS',
      input: row.address
    }
    return filter;
  }

  const getConsumersFilter = (row: any) => {
    var filter: Filter = {
      column: 'queue',
      operation: 'EQUALS',
      input: row.name
    }
    return filter;
  }

  const messageView = (row: any) => { 
    navigate.selectQueue(row.name, row.address, row.routingType); 
  }

  const allColumns: Column[] = [
    { id: 'id', name: 'ID', visible: true, sortable: true, filterable: true },
    { id: 'name', name: 'Name', visible: true, sortable: true, filterable: true },
    { id: 'address', name: 'Address', visible: true, sortable: true, filterable: true, filter: getAddressFilter, filterTab: 5},
    { id: 'routingType', name: 'Routing Type', visible: true, sortable: true, filterable: true },
    { id: 'filter', name: 'Filter', visible: true, sortable: true, filterable: true },
    { id: 'durable', name: 'Durable', visible: true, sortable: true, filterable: true },
    { id: 'maxConsumers', name: 'Max Consumers', visible: true, sortable: true, filterable: true },
    { id: 'purgeOnNoConsumers', name: 'Purge On No Consumers', visible: true, sortable: true, filterable: true },
    { id: 'consumerCount', name: 'Consumer Count', visible: true, sortable: true, filterable: true, filter: getConsumersFilter, filterTab: 4},
    { id: 'messageCount', name: 'Message Count', visible: false, sortable: true, filterable: true, link: messageView},
    { id: 'paused', name: 'Paused', visible: false, sortable: true, filterable: true },
    { id: 'temporary', name: 'Temporary', visible: false, sortable: true, filterable: true },
    { id: 'autoCreated', name: 'Auto Created', visible: false, sortable: true, filterable: true },
    { id: 'user', name: 'User', visible: false, sortable: true, filterable: true },
    { id: 'messagesAdded', name: 'Total Messages Added', visible: false, sortable: true, filterable: true },
    { id: 'messagesAcked', name: 'Total Messages Acked', visible: false, sortable: true, filterable: true },
    { id: 'deliveringCount', name: 'Delivering Count', visible: false, sortable: true, filterable: true },
    { id: 'messagesKilled', name: 'Messages Killed', visible: false, sortable: true, filterable: true },
    { id: 'directDeliver', name: 'Direct Deliver', visible: false, sortable: true, filterable: true },
    { id: 'exclusive', name: 'Exclusive', visible: false, sortable: true, filterable: true },
    { id: 'lastValue', name: 'Last Value', visible: false, sortable: true, filterable: true },
    { id: 'lastValueKey', name: 'Last Value Key', visible: false, sortable: true, filterable: true },
    { id: 'scheduledCount', name: 'Scheduled Count', visible: false, sortable: true, filterable: true },
    { id: 'groupRebalance', name: 'Group Rebalance', visible: false, sortable: true, filterable: true },
    { id: 'groupRebalancePauseDispatch', name: 'Group Rebalance Pause Dispatch', visible: false, sortable: true, filterable: true },
    { id: 'groupBuckets', name: 'Group Buckets', visible: false, sortable: true, filterable: true },
    { id: 'groupFirstKey', name: 'Group First Key', visible: false, sortable: true, filterable: true },
    { id: 'enabled', name: 'Queue Enabled', visible: false, sortable: true, filterable: true },
    { id: 'ringSize', name: 'Ring Size', visible: false, sortable: true, filterable: true },
    { id: 'consumersBeforeDispatch', name: 'Consumers Before Dispatch', visible: false, sortable: true, filterable: true },
    { id: 'delayBeforeDispatch', name: 'Delay Before Dispatch', visible: false, sortable: true, filterable: true },
    { id: 'autoDelete', name: 'Auto Delete', visible: false, sortable: true, filterable: true }
  ];

  const listQueues = async (page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<any> => {
    const response = await artemisService.getQueues(page, perPage, activeSort, filter);
    const data = JSON.parse(response);
    return data;
  }

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [queue, setQueue] = useState("");
  const [address, setAddress] = useState("");
  const [routingType, setRoutingType] = useState("");
  const [queueToPurgeAddress, setQueueToPurgeAddress] = useState("");
  const [queueToPurgeRoutingType, setQueueToPurgeRoutingType] = useState(""); 
  const [showAttributesDialog, setShowAttributesDialog] = useState(false);
  const [showOperationsDialog, setShowOperationsDialog] = useState(false);
  const routenavigate = useNavigate();
  const { brokerNode, findAndSelectNode } = useContext(ArtemisContext);

  const canDeleteQueue = artemisService.canDeleteQueue(brokerNode);
  const [loadData, setLoadData] = useState(0);

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  const closePurgeDialog = () => {
    setShowPurgeDialog(false);
  };

  const closeSendDialog = () => {
    setShowSendDialog(false);
  };

  const deleteQueue = async (name: string) => {
    await artemisService.deleteQueue(name)
      .then((value: unknown) => {
        setShowDeleteDialog(false);
        setLoadData(loadData + 1);
        eventService.notify({
          type: 'success',
          message: 'Queue Deleted',
          duration: 3000,
        })
      })
      .catch((error: string) => {
        setShowDeleteDialog(false);
        eventService.notify({
          type: 'danger',
          message: 'Queue Not Deleted: ' + error,
        })
      });
  };

  const purgeQueue = (name: string, address: string, routingType: string) => {
    artemisService.purgeQueue(name, address, routingType)
      .then(() => {
        setShowPurgeDialog(false);
        setLoadData(loadData + 1);
        eventService.notify({
          type: 'success',
          message: 'Queue Purged',
          duration: 3000,
        })
      })
      .catch((error: string) => {
        setShowPurgeDialog(false);
        eventService.notify({
          type: 'danger',
          message: 'Queue Not Purged: ' + error,
        })
      });
  };

  const getRowActions = (row: any, rowIndex: number): IAction[] => {
    var actions: IAction[] =  [
      {
        title: 'Show in Artemis JMX',
        onClick: async () => {
          setAddress(row.name);
          const brokerObjectName = await artemisService.getBrokerObjectName();
          const queueObjectName = createQueueObjectName(brokerObjectName,row.address, row.routingType,  row.name);
          findAndSelectNode(queueObjectName, row.name);
          routenavigate('/treeartemisJMX')
        }
      },
      {
        title: 'Attributes',
        onClick: async () => {
          setAddress(row.name);
          const brokerObjectName = await artemisService.getBrokerObjectName();
          const queueObjectName = createQueueObjectName(brokerObjectName,row.address, row.routingType,  row.name);          
          findAndSelectNode(queueObjectName, row.name);
          setShowAttributesDialog(true);
        }
      },
      {
        title: 'Operations',
        onClick: async () => {
          setAddress(row.name);
          const brokerObjectName = await artemisService.getBrokerObjectName();
          const queueObjectName = createQueueObjectName(brokerObjectName,row.address, row.routingType,  row.name);
          findAndSelectNode(queueObjectName, row.name);
          setShowOperationsDialog(true);
        }
      }
    ]


    if (canDeleteQueue) {
      actions.push(
        {
          title: 'Delete',
          onClick: () => {
            setQueue(row.name);
            setShowDeleteDialog(true);
          }
        }
      );
    }

    var canSendMessage = artemisService.canSendMessageToQueue(brokerNode, row.name);
    if (canSendMessage) {
      actions.push(
        {
          title: 'Send Message',
          onClick: () => {
            setQueue(row.name);
            setAddress(row.address);
            setRoutingType(row.routingType)
            setShowSendDialog(true);
          }
  
        }
      );
    }

    var canPurgeQueue = artemisService.canPurgeQueue(brokerNode, row.name);
    if (canPurgeQueue) {
      actions.push(
        {
          title: 'Purge',
          onClick: () => {
            setQueue(row.name);
            setQueueToPurgeAddress(row.address);
            setQueueToPurgeRoutingType(row.routingType);
            setShowPurgeDialog(true);
          }
        }
      );
    }

    var canBrowseQueue = artemisService.canBrowseQueue(brokerNode, row.name);
    if (canBrowseQueue) {
      actions.push(
        {
          title: 'Browse Messages',
          onClick: () => {
            navigate.selectQueue(row.name, row.address, row.routingType);
          }
  
        }
      );
    }


    return actions;
  };

  return (
    <><ArtemisTable allColumns={allColumns} getData={listQueues} getRowActions={getRowActions} loadData={loadData} storageColumnLocation="queuesColumnDefs" navigate={navigate.search} filter={navigate.filter} /><Modal
      aria-label='queue-delete-modal'
      variant={ModalVariant.medium}
      title="Delete Queue?"
      isOpen={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => deleteQueue(queue)}>
          Confirm
        </Button>,
        <Button key="cancel" variant="secondary" onClick={closeDeleteDialog}>
          Cancel
        </Button>
      ]}><p>You are about to delete queue <b>{queue}</b>.</p>
      <p>This operation cannot be undone so please be careful.</p>
    </Modal>
    <Modal
        aria-label='attributes-modal'
        variant={ModalVariant.medium}
        isOpen={showAttributesDialog}
        onClose={() => setShowAttributesDialog(false)}
        actions={[
          <Button key="close" variant="primary" onClick={() => setShowAttributesDialog(false)}>
            Close
          </Button>
        ]}>
        <Attributes />
      </Modal>
      <Modal
        aria-label='operations-modal'
        variant={ModalVariant.medium}
        isOpen={showOperationsDialog}
        onClose={() => setShowOperationsDialog(false)}
        actions={[
          <Button key="close" variant="primary" onClick={() => setShowOperationsDialog(false)}>
            Close
          </Button>
        ]}>
        <Operations />
      </Modal>
    <Modal
      aria-label='queue-purge-modal'
      variant={ModalVariant.medium}
      title="Purge Queue?"
      isOpen={showPurgeDialog}
      onClose={() => setShowPurgeDialog(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => purgeQueue(queue, queueToPurgeAddress, queueToPurgeRoutingType)}>
          Confirm
        </Button>,
        <Button key="cancel" variant="secondary" onClick={closePurgeDialog}>
          Cancel
        </Button>
      ]}><p>You are about to remove all messages from queue <b>{queue}</b>.</p>
        <p>This operation cannot be undone so please be careful.</p>
      </Modal>
      <Modal
        aria-label='queue-send-modal'
        variant={ModalVariant.medium}
        isOpen={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        actions={[
          <Button key="close" variant="secondary" onClick={closeSendDialog}>
            Cancel
          </Button>
        ]}>
        <SendMessage address={address} queue={queue} routingType={routingType} isAddress={false} />
      </Modal></>
  )
}
