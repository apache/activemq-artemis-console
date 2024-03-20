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
import { Column } from "./table/ArtemisTable"

export interface IArtemisPreferencesService {
  loadArtemisPreferences(): ArtemisOptions
  saveArtemisPreferences(newValues: Partial<ArtemisOptions>): void
  loadColumnPreferences(storageLocation: string, columns: Column[]): Column[]
  saveColumnPreferences(storageLocation: string, columns: Column[]): void
}

export type ArtemisOptions = {
  artemisDLQ: string
  artemisExpiryQueue: string
  artemisBrowseBytesMessages: number
}

export const ARTEMIS_PREFERENCES_DEFAULT_VALUES: ArtemisOptions = {
  artemisDLQ: "^DLQ$",
  artemisExpiryQueue: "^ExpiryQueue$",
  artemisBrowseBytesMessages: 99,
} as const

export const STORAGE_KEY_ARTEMIS_PREFERENCES = 'artemis.preferences'

class ArtemisPreferencesService implements IArtemisPreferencesService {
  loadArtemisPreferences(): ArtemisOptions {
    return { ...ARTEMIS_PREFERENCES_DEFAULT_VALUES, ...this.loadFromStorage() }
  }

  saveArtemisPreferences(newValues: Partial<ArtemisOptions>): void {
    const preferencesToSave = { ...this.loadFromStorage(), ...newValues }

    localStorage.setItem(STORAGE_KEY_ARTEMIS_PREFERENCES, JSON.stringify(preferencesToSave))
  }

  loadColumnPreferences(storageLocation: string, columns: Column[]): Column[] {
    const localStorageData = localStorage.getItem(storageLocation);
    if (localStorageData) {
      const data = JSON.parse(localStorageData);
      data.forEach((def: { name: string; visible: boolean | undefined }) => {
        const column = columns.find(column => column.id === def.name);
        if (column) {
          column.visible = def.visible as boolean;
        }
      })
    };
    return columns;
  }

  saveColumnPreferences(storageLocation: string, columns: Column[]) {
    const data: { name: string; visible: boolean }[] = [];
    columns.forEach(column => { data.push({ name: column.id, visible: column.visible }) });
    localStorage.setItem(storageLocation, JSON.stringify(data));
  }

  private loadFromStorage(): Partial<ArtemisOptions> {
    const localStorageData = localStorage.getItem(STORAGE_KEY_ARTEMIS_PREFERENCES)

    return localStorageData ? JSON.parse(localStorageData) : {}
  }
}

export const artemisPreferencesService = new ArtemisPreferencesService()
