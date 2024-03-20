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
import React, { FormEvent, useRef, useState } from 'react'
import * as monacoEditor from 'monaco-editor'
import xmlFormat from 'xml-formatter'

import {
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  PageSection,
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  TextInput,
  Title,
  Text,
  Checkbox,
  Tooltip,
  Popover,
  TextContent
} from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon, InfoCircleIcon } from '@patternfly/react-icons'
import { TrashIcon } from '@patternfly/react-icons'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import { eventService } from '@hawtio/react'
import { artemisService } from '../artemis-service'
import { Message } from './MessageView'

type SendBodyMessageProps = {
  onBodyChange: (body: string) => void
  body?: string
}

type SendMessageProps = {
  queue: string
  routingType: string
  address: string
  isAddress: boolean
  message?: Message
}

const MessageBody: React.FunctionComponent<SendBodyMessageProps> = props => {
  const [messageBody, setMessageBody] = useState<string>(props.body?props.body:'')
  const [selectedFormat, setSelectedFormat] = useState<Language>(Language.xml)
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null)

  const editorDidMount = (editor: monacoEditor.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  const handleAutoFormat = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        if (selectedFormat === Language.xml) {
          //monaco doesn't have built in xml formatter
          updateMessageBody(xmlFormat(messageBody))
        } else {
          const range = model.getFullModelRange()
          editorRef.current.trigger('', 'editor.action.formatDocument', { range })
        }
      }
    }
  }

  const updateMessageBody = (body: string) => {
    setMessageBody(body)
    props.onBodyChange(body)
  }
  const handleToggle = () => {
    setDropdownOpen(!isDropdownOpen)
  }
  const handleFormatChange = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
    setSelectedFormat(value as Language)
    setDropdownOpen(false)
  }


  return (
    <>
      <FormGroup label='Message'>
        <CodeEditor
          code={messageBody}
          onEditorDidMount={editorDidMount}
          language={selectedFormat}
          height={'300px'}
          onChange={updateMessageBody}
        />
      </FormGroup>
      <FormGroup>
        <Flex>
          <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
            {' '}
            <Select
              variant={SelectVariant.single}
              aria-label='Select Format'
              onToggle={handleToggle}
              onSelect={handleFormatChange}
              selections={selectedFormat}
              isOpen={isDropdownOpen}
            >
              <SelectOption label='plaintext' value={Language.plaintext} />
              <SelectOption label='xml' value={Language.xml} />
              <SelectOption label='json' value={Language.json} />
            </Select>
          </FlexItem>{' '}
          <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }}>
            <Button onClick={handleAutoFormat}>Format</Button>
          </FlexItem>
        </Flex>
      </FormGroup>
    </>
  )
}

type MessageHeadersProps = {
  onHeadersChange: (headers: { name: string; value: string }[]) => void
  headers?: any
}
const MessageHeaders: React.FunctionComponent<MessageHeadersProps> = props => {
  const initialheaders: Array<{ name: string; value: string }> = [];
  if(props.headers) {
    Object.keys(props.headers).forEach((key, index) => {
      initialheaders.push({
        name: key,
        value: props.headers?props.headers[key]:''
      });
  })
  }
  const [headers, setHeaders] = useState<Array<{ name: string; value: string }>>(initialheaders)

  const handleInputChange = (index: number, newValue: string, event: React.FormEvent<HTMLInputElement>) => {
    const updatedHeaders = [...headers]
    updatedHeaders[index] = { ...updatedHeaders[index], [event.currentTarget.name]: newValue }
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }
  const handleAddHeader = () => {
    const updatedHeaders = [...headers, { name: '', value: '' }]
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }

  const handleRemoveHeader = (index: number) => {
    const updatedHeaders = [...headers]
    updatedHeaders.splice(index, 1)
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }

  return (
    <>
      <FormGroup>
        {/* eslint-disable-next-line react/jsx-no-undef */}
        <Button variant='link' onClick={handleAddHeader}>
          Add Headers
        </Button>
      </FormGroup>
      <FormGroup>
        {headers.length > 0 && (
          <Flex>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>Name</FlexItem>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>Value</FlexItem>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }}></FlexItem>
          </Flex>
        )}

        {headers.length > 0 &&
          headers.map((header, index) => (
            <Flex key={index}>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
                <TextInput
                  type='text'
                  aria-label={'name-input-' + index}
                  name='name'
                  value={header.name}
                  onChange={(newValue, event) => handleInputChange(index, newValue, event)}
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
                <TextInput
                  type='text'
                  name='value'
                  aria-label={'value-input-' + index}
                  value={header.value}
                  onChange={(newValue, event) => handleInputChange(index, newValue, event)}
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }} span={4}>
                <Button variant='link' onClick={() => handleRemoveHeader(index)} aria-label='Remove Header'>
                  <TrashIcon />
                </Button>
              </FlexItem>
            </Flex>
          ))}
      </FormGroup>
    </>
  )
}

export const SendMessage: React.FunctionComponent<SendMessageProps> = (props: SendMessageProps) => {
  const [isDurableChecked, setIsDurableChecked] = useState<boolean>(props.message? props.message.durable:true);
  const [isCreateIDChecked, setIsCreateIDChecked] = useState<boolean>(false);
  const [isUseLogonChecked, setIsUselogonChecked] = useState<boolean>(true);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  
  const messageHeaders = useRef<Array<{ name: string; value: string }>>([])
  const messageBody = useRef<string>('')

  const updateHeaders = (headers: { name: string; value: string }[]) => {
    messageHeaders.current = [...headers]
  }
  const updateTheMessageBody = (body: string) => {
    messageBody.current = body
  }

  const handleUsernameChange = (name: string) => {
    setUsername(name);
  };

  const handlePasswordChange = (password: string) => {
    setPassword(password);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (props.isAddress) {
      artemisService.doSendMessageToAddress(messageBody.current, messageHeaders.current, isDurableChecked, isCreateIDChecked, isUseLogonChecked, username, password, props.address)
        .then(() => {
          eventService.notify({
            type: 'success',
            message: "Message Succcesfully Sent",
          })
        })
        .catch((error: string) => {
          eventService.notify({
            type: 'warning',
            message: error,
          })
        })
    } else {
      artemisService.doSendMessageToQueue(messageBody.current, messageHeaders.current, isDurableChecked, isCreateIDChecked, isUseLogonChecked, username, password, props.routingType.toLowerCase(), props.queue, props.address)
        .then(() => {
          eventService.notify({
            type: 'success',
            message: "Message Succcesfully Sent",
          })
        })
        .catch((error: string) => {
          eventService.notify({
            type: 'warning',
            message: error,
          })
        })
    }
  }


  const Hint = () => (
    <TextContent>
      <Text component='p'>
        This page allows you to create a queue bound to the chosen address.
      </Text>
      <Text component='p'>
        This page allows you to send a message to the chosen queue. The message will be of type <code>text</code>
        message and it will be possible to add headers to the message. The sending of the message will be authenticated
        using the current logon user, unselect <code>use current logon user</code> to use a different user.
      </Text>
    </TextContent>
  )

  return (
    <PageSection variant='light'>
      <Title headingLevel='h1'>Send Message to {props.isAddress ? 'Address' : 'Queue'} {props.address}
        <Popover bodyContent={Hint}><OutlinedQuestionCircleIcon /></Popover></Title>
      <Text component='p'>  <br /></Text>
      <Form onSubmit={handleSubmit}>
        <FormGroup
          label="Durable"
          labelIcon={<Tooltip content='If durable the message will be marked persistent and written to the brokers journal if the destination queue is durable.'><InfoCircleIcon /></Tooltip>}
        >
          <Checkbox
            isChecked={isDurableChecked}
            onChange={() => setIsDurableChecked(!isDurableChecked)}
            id="durable" />

        </FormGroup>
        <FormGroup label="Create Message ID"
          labelIcon={
            <Tooltip content='The Message ID is an automatically generated UUID that is set on the Message by the broker before it is routed.
          If using a JMS client this would be the JMS Message ID on the JMS Message, this typically would not get
          set for non JMS clients. Historically and on some other tabs this is also referred to as the User ID..'><InfoCircleIcon />
            </Tooltip>}>
          <Checkbox
            isChecked={isCreateIDChecked}
            onChange={() => setIsCreateIDChecked(!isCreateIDChecked)}
            id="createid" />
        </FormGroup>
        <FormGroup label="Use Current Logged in User"
          labelIcon={<Tooltip content='This option allows a user to send messages with the permissions of the users current logon, disable it to send messages with different permissions than the users current logon provides'><InfoCircleIcon /></Tooltip>}
        >
          <Checkbox
            isChecked={isUseLogonChecked}
            onChange={() => setIsUselogonChecked(!isUseLogonChecked)}
            id="uselogon" />
        </FormGroup>
        {!isUseLogonChecked &&
          <><FormGroup label="Username">
            <TextInput
              value={username}
              type='text'
              onChange={handleUsernameChange}
              id="username"
              name="username" />
          </FormGroup><FormGroup label="Password">
              <TextInput
                value={password}
                type='password'
                onChange={handlePasswordChange}
                id="password"
                name="password" />
            </FormGroup></>
        }
        <MessageHeaders onHeadersChange={updateHeaders} headers={props.message?.StringProperties}/>
        <MessageBody onBodyChange={updateTheMessageBody} body={props.message?.text} />
        <FormGroup>

          <Button type='submit' className='pf-m-1-col'>
            Send
          </Button>
        </FormGroup>
      </Form>
    </PageSection>
  )
}
