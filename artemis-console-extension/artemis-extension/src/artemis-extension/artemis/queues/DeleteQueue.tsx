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
import { ActionGroup, Button, Form, Modal, ModalVariant, Title } from '@patternfly/react-core';
import React, { useState } from 'react'
import { ConnectHint } from '../util/ConnectHint';
import { eventService, workspace } from '@hawtio/react';
import { artemisService } from '../artemis-service';

type DeleteQueueProps = {
  queue: string
  address: string
  routingType: string
}
export const DeleteQueue: React.FunctionComponent<DeleteQueueProps> = (props: DeleteQueueProps) => {

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);


  const deleteQueue = async (name: string) => {
    await artemisService.deleteQueue(name)
      .then((value: unknown) => {
        setShowDeleteModal(false);
        workspace.refreshTree();
        eventService.notify({
          type: 'success',
          message: 'Queue Deleted',
          duration: 3000,
        })
      })
      .catch((error: string) => {
        setShowDeleteModal(false);
        eventService.notify({
          type: 'danger',
          message: 'Queue Not Deleted: ' + error,
        })
      });
  };

  const purgeQueue = async () => {
    await artemisService.purgeQueue(props.queue, props.address, props.routingType)
      .then((value: unknown) => {
        setShowPurgeModal(false);
        eventService.notify({
          type: 'success',
          message: 'Queue Purged',
          duration: 3000,
        })
      })
      .catch((error: string) => {
        setShowPurgeModal(false);
        eventService.notify({
          type: 'danger',
          message: 'Queue Not Purged: ' + error,
        })
      });
  };

  return (
    <>
      <Title headingLevel="h2">Delete/Purge Queue {props.queue}</Title>
      <ConnectHint text={["This allows you to delete the chosen Queue on the broker.", "Note that this will only succeed if the queue has no consumers bound to it."]}/>
      <Form>
        <ActionGroup>
          <Button variant="primary" onClick={() => setShowDeleteModal(true)} >Delete</Button>
        </ActionGroup>
      </Form>
      <ConnectHint text={["This allows you to delete all the messages in the chosen Queue on the broker.", ""]}/>
      <Form>
        <ActionGroup>
          <Button variant="primary" onClick={() => setShowPurgeModal(true)} >Purge</Button>
        </ActionGroup>
      </Form>
      <Modal
      aria-label='queue-delete-modal'
      variant={ModalVariant.medium}
      title="Delete Queue?"
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => deleteQueue(props.queue)}>
          Confirm
        </Button>,
        <Button key="cancel" variant="secondary" onClick={() => setShowDeleteModal(false)}>
          Cancel
        </Button>
      ]}><p>You are about to delete queue <b>{props.queue}</b>.</p>
      <p>This operation cannot be undone so please be careful.</p>
    </Modal>
    <Modal
      aria-label='queue-purge-modal'
      variant={ModalVariant.medium}
      title="Purge Queue?"
      isOpen={showPurgeModal}
      onClose={() => setShowPurgeModal(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => purgeQueue()}>
          Confirm
        </Button>,
        <Button key="cancel" variant="secondary" onClick={() => setShowPurgeModal(false)}>
          Cancel
        </Button>
      ]}><p>You are about to delete all the messages in queue <b>{props.queue}</b>.</p>
      <p>This operation cannot be undone so please be careful.</p>
    </Modal>
    </>
  )
}