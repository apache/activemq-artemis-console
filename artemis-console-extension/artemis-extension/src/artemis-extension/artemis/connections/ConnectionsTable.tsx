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
import { Modal, ModalVariant, Button } from '@patternfly/react-core';
import { IAction } from '@patternfly/react-table';
import { eventService } from '@hawtio/react';

export const ConnectionsTable: React.FunctionComponent<Navigate> = (navigate) => {
  const getSessionFilter = (row: any) => {
    var filter: Filter = {
      column: 'connectionID',
      operation: 'EQUALS',
      input: row.connectionID
    }
    return filter;
  }
  const defaultColumns: Column[] = [
    { id: 'connectionID', name: 'ID', visible: true, sortable: true, filterable: true },
    { id: 'clientID', name: 'Client ID', visible: true, sortable: true, filterable: true },
    { id: 'users', name: 'Users', visible: true, sortable: true, filterable: true },
    { id: 'protocol', name: 'Protocol', visible: true, sortable: true, filterable: true },
    { id: 'sessionCount', name: 'Session Count', visible: true, sortable: true, filterable: true, filter: getSessionFilter, filterTab: 2 },
    { id: 'remoteAddress', name: 'Remote Address', visible: true, sortable: true, filterable: true },
    { id: 'localAddress', name: 'Local Address"', visible: true, sortable: true, filterable: true },
    { id: 'session', name: 'Session ID', visible: true, sortable: true, filterable: false },
    { id: 'creationTime', name: 'Creation Time', visible: true, sortable: true, filterable: false }
  ];

  const [showConnectionCloseDialog, setShowConnectionCloseDialog] = useState(false);
  const [connectionToClose, setConnectionToClose] = useState("");
  const [loadData, setLoadData] = useState(0);

  const listConnections = async (page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<any> => {
    const response = await artemisService.getConnections(page, perPage, activeSort, filter);
    const data = JSON.parse(response);
    return data;
  }


  const closeConnection = (name: string) => {
    artemisService.closeConnection(connectionToClose)
      .then((value: unknown) => {
        setShowConnectionCloseDialog(false);
        setLoadData(loadData + 1);
        eventService.notify({
          type: 'success',
          message: 'Connection Closed',
          duration: 3000,
        })
      })
      .catch((error: string) => {
        setShowConnectionCloseDialog(false);
        eventService.notify({
          type: 'danger',
          message: 'Connection Not Closed: ' + error,
        })
      });
  };

  const getRowActions = (row: any, rowIndex: number): IAction[] => {
    return [
      {
        title: 'Close',
        onClick: () => {
          console.log(`clicked on Some action, on row delete ` + row.connectionID);
          setConnectionToClose(row.connectionID);
          setShowConnectionCloseDialog(true);
        }
      }
    ]
  };

  return (
    <>
      <ArtemisTable allColumns={defaultColumns} getData={listConnections} storageColumnLocation="connectionsColumnDefs" getRowActions={getRowActions} loadData={loadData} navigate={navigate.search} filter={navigate.filter}/>
      <Modal
        aria-label='connection-close-modal'
        variant={ModalVariant.medium}
        title="Close Connection?"
        isOpen={showConnectionCloseDialog}
        actions={[
          <Button key="confirm" variant="primary" onClick={() => closeConnection(connectionToClose)}>
            Confirm
          </Button>,
          <Button key="cancel" variant="secondary" onClick={() => setShowConnectionCloseDialog(false)}>
            Cancel
          </Button>
        ]}><p>You are about to close connection with id:  <b>{connectionToClose}</b>.</p>
        <p>This operation cannot be undone so please be careful.</p>
      </Modal>
    </>)
}
