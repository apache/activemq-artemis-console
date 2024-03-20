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
import React, { useState } from 'react'
import { Navigate } from '../views/ArtemisTabView.js';
import { ActiveSort, ArtemisTable, Column, Filter } from '../table/ArtemisTable';
import { artemisService } from '../artemis-service';
import { eventService } from '@hawtio/react';
import { Modal, ModalVariant, Button } from '@patternfly/react-core';
import { IAction } from '@patternfly/react-table';

export const ConsumerTable: React.FunctionComponent<Navigate> = navigate => {
  const getSessionFilter = (row: any) => {
    var filter: Filter = {
      column: 'id',
      operation: 'EQUALS',
      input: row.session
    }
    return filter;
  }

  const getQueueFilter = (row: any) => {
    var filter: Filter = {
      column: 'name',
      operation: 'EQUALS',
      input: row.queue
    }
    return filter;
  }

  const getAddressFilter = (row: any) => {
    var filter: Filter = {
      column: 'name',
      operation: 'EQUALS',
      input: row.address
    }
    return filter;
  }

    const allColumns: Column[] = [
      {id: 'id', name: 'ID', visible: true, sortable: true, filterable: true},
      {id: 'session', name: 'Session', visible: true, sortable: true, filterable: true, filter: getSessionFilter, filterTab: 2},
      {id: 'clientID', name: 'Client ID', visible: true, sortable: true, filterable: true},
      {id: 'validatedUser', name: 'Validated User', visible: true, sortable: true, filterable: true},
      {id: 'protocol', name: 'Protocol', visible: true, sortable: true, filterable: false},
      {id: 'queue', name: 'Queue', visible: true, sortable: true, filterable: true, filter: getQueueFilter, filterTab: 6},
      {id: 'queueType', name: 'Queue Type', visible: true, sortable: true, filterable: false},
      {id: 'filter', name: 'Filter', visible: true, sortable: true, filterable: false},
      {id: 'address', name: 'Address', visible: true, sortable: true, filterable: true, filter: getAddressFilter, filterTab: 5},
      {id: 'remoteAddress', name: 'Remote Address', visible: true, sortable: true, filterable: true},
      {id: 'localAddress', name: 'Local Address', visible: true, sortable: true, filterable: true},
      {id: 'creationTime', name: 'Creation Time', visible: true, sortable: true, filterable: false},
      {id: 'messagesInTransit', name: 'Messages in Transit', visible: false, sortable: true, filterable: true},
      {id: 'messagesInTransitSize', name: 'Messages in Transit Size', visible: false, sortable: true, filterable: true},
      {id: 'messagesDelivered', name: 'Messages Delivered', visible: false, sortable: true, filterable: true},
      {id: 'messagesDeliveredSize', name: 'Messages Delivered Size', visible: false, sortable: true, filterable: true},
      {id: 'messagesAcknowledged', name: 'Messages Acknowledged', visible: false, sortable: true, filterable: true},
      {id: 'messagesAcknowledgedAwaitingCommit', name: 'Messages Acknowledged awaiting Commit', visible: false, sortable: true, filterable: true},
      {id: 'lastDeliveredTime', name: 'Last Delivered Time', visible: false, sortable: true, filterable: false},
      {id: 'lastAcknowledgedTime', name: 'Last Acknowledged Time', visible: false, sortable: true, filterable: false},
      ];

      const listConsumers = async ( page: number, perPage: number, activeSort: ActiveSort, filter: Filter):Promise<any> => {
        const response = await artemisService.getConsumers(page, perPage, activeSort, filter);
        const data = JSON.parse(response);
        return data;
      }

      const [showConsumerCloseDialog, setShowConsumerCloseDialog] = useState(false);
      const [consumerToClose, setConsumerToClose] = useState("");
      const [session, setSession] = useState("");
      const [loadData, setLoadData] = useState(0);

      const closeConsumer = () => {
        artemisService.closeConsumer(session, consumerToClose)
          .then((value: unknown) => {
            setShowConsumerCloseDialog(false);
            setLoadData(loadData + 1);
            eventService.notify({
              type: 'success',
              message: 'Consumer Closed',
              duration: 3000,
            })
          })
          .catch((error: string) => {
            setShowConsumerCloseDialog(false);
            eventService.notify({
              type: 'danger',
              message: 'Consumer Not Closed: ' + error,
            })
          });
      };
    
      const getRowActions = (row: any, rowIndex: number): IAction[] => {
        return [
          {
            title: 'Close',
            onClick: () => {
              console.log(`clicked on Some action, on row delete ` + row.id);
              setConsumerToClose(row.id);
              setSession(row.session);
              setShowConsumerCloseDialog(true);
            }
          }
        ]
      };
      
    return (
      <>
      <ArtemisTable allColumns={allColumns} getData={listConsumers} getRowActions={getRowActions} storageColumnLocation="consumerColumnDefs"  navigate={navigate.search} filter={navigate.filter}/>
      <Modal
        aria-label='consumer-close-modal'
        variant={ModalVariant.medium}
        title="Close Consumer?"
        isOpen={showConsumerCloseDialog}
        actions={[
          <Button key="confirm" variant="primary" onClick={() => closeConsumer()}>
            Confirm
          </Button>,
          <Button key="cancel" variant="secondary" onClick={() => setShowConsumerCloseDialog(false)}>
            Cancel
          </Button>
        ]}><p>You are about to close consumer with id:  <b>{consumerToClose}</b>.</p>
        <p>This operation cannot be undone so please be careful.</p>
      </Modal>
      </>
    )
}