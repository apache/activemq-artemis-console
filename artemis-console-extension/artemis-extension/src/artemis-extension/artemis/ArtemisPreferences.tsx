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
import { CardBody, Flex, FlexItem, Form, FormGroup, FormSection, MenuToggle, MenuToggleElement, Select, SelectList, SelectOption, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import { artemisPreferencesService, ArtemisOptions } from './artemis-preferences-service'
import { Icon, Tooltip } from '@patternfly/react-core'
import { HelpIcon } from '@patternfly/react-icons'

export const ArtemisPreferences: React.FunctionComponent = () => (
  <CardBody>
    <Form isHorizontal>
      <ArtemisPreferencesForm />
    </Form>
  </CardBody>
)

export const TooltipHelpIcon = ({ tooltip }: { tooltip: string }) => (
  <Icon size='md'>
    <Tooltip content={tooltip}>
      <HelpIcon />
    </Tooltip>
  </Icon>
)


type FormatType = {
  id: string;
  description: string;
  index: number;
}


const ArtemisPreferencesForm: React.FunctionComponent = () => {
  const off: FormatType = { id: "off", description: "Off", index: 99 };
  const text: FormatType = { id: "text", description: "Text", index: 16 }
  const decimal: FormatType = { id: "decimal", description: "Decimal", index: 8 }
  const hex: FormatType = { id: "hex", description: "Hex", index: 4 }
  const decimaltext: FormatType = { id: "decimaltext", description: "Decimal and Text", index: 2 }
  const hexttext: FormatType = { id: "hexttext", description: "Hex and Text", index: 1 }

  const formats = [off, text, decimal, hex, decimaltext, hexttext];

  const [artemisPreferences, setArtemisPreferences] = useState(artemisPreferencesService.loadArtemisPreferences())
  const [isDropdownOpen, setDropdownOpen] = React.useState(false);
  const format = formats.find(format => format.index === artemisPreferences.artemisBrowseBytesMessages);
  const [selectedFormat, setSelectedFormat] = useState(format ? format.description : off.description);

  const updatePreferences = (value: string | number | boolean, key: keyof ArtemisOptions): void => {
    const updatedPreferences = { ...artemisPreferences, ...{ [key]: value } }

    artemisPreferencesService.saveArtemisPreferences(updatedPreferences)
    setArtemisPreferences(updatedPreferences)
  }

  const updateStringValueFor = (key: keyof ArtemisOptions): ((event: React.FormEvent<HTMLInputElement>, value: string) => void) => {
    return (_event: React.FormEvent<HTMLInputElement>, value: string) => {
      if (!value) return

      updatePreferences(value, key)
    }
  }

  const handleToggle = () => {
    setDropdownOpen(!isDropdownOpen)
  }

  const handleFormatChange = (event?: React.MouseEvent<Element, MouseEvent>, value?: string | number) => {
    setSelectedFormat(value as string);
    setDropdownOpen(false);
    const format = formats.find(format => format.description === value);
    if (format) {
      updatePreferences(format?.index, 'artemisBrowseBytesMessages');
    }
  }


  return (
    <FormSection title='Artemis' titleElement='h2'>
      <FormGroup
        hasNoPaddingTop
        label='Dead-letter address regex'
        fieldId='artemis-form-artemisDLQ'
        labelIcon={
          <TooltipHelpIcon tooltip='A regular expression to match one or more dead-letter addresses' />
        }
      >
        <TextInput
          id='artemis-input-artemisDLQ'
          type='text'
          value={artemisPreferences.artemisDLQ}
          onChange={updateStringValueFor('artemisDLQ')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Expiry address regex'
        fieldId='artemis-form-expiry'
        labelIcon={<TooltipHelpIcon tooltip='A regular expression to match one or more expiry addresses' />}
      >
        <TextInput
          id='artemis-input-expiry'
          type='text'
          value={artemisPreferences.artemisExpiryQueue}
          onChange={updateStringValueFor('artemisExpiryQueue')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Browse Bytes Messages'
        fieldId='artemis-form-showJMXView'
        labelIcon={
          <TooltipHelpIcon tooltip='Browsing Bytes messages should show the body as this.' />
        }>
        <Flex>
          <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
            {' '}
            <Select
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle isFullWidth role='menu' ref={toggleRef} onClick={handleToggle}>
                    {selectedFormat}
                  </MenuToggle>
                )}
              aria-label='Select Format'
              onSelect={handleFormatChange}
              selected={selectedFormat}
              isOpen={isDropdownOpen}
            >
              <SelectList>
                <SelectOption label={off.id} value={off.description}>{off.description}</SelectOption>
                <SelectOption label={text.id} value={text.description}>{text.description}</SelectOption>
                <SelectOption label={decimal.id} value={decimal.description}>{decimal.description}</SelectOption>
                <SelectOption label={hex.id} value={hex.description}>{hex.description}</SelectOption>
                <SelectOption label={decimaltext.id} value={decimaltext.description}>{decimaltext.description}</SelectOption>
                <SelectOption label={hexttext.id} value={hexttext.description}>{hexttext.description}</SelectOption>
              </SelectList>
            </Select>
          </FlexItem>
        </Flex>
      </FormGroup>

    </FormSection>
  )
}
