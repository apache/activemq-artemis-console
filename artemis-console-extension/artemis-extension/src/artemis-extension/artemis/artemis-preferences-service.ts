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

const PAGE_SIZE = ".pageSize";

export const columnStorage = {
  queues: "queuesColumnDefs",
  addresses: "addressesColumnDefs",
  connections: "connectionsColumnDefs",
  consumers: "consumerColumnDefs",
  producers: "producerColumnDefs",
  sessions: "sessionsColumnDefs",
  messages: "messagesColumnDefs"
}
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
  artemisDefaultPageSize: number
  artemisMaxDiagramAddressSize: number
}

export const ARTEMIS_PREFERENCES_DEFAULT_VALUES: ArtemisOptions = {
  artemisDLQ: "^DLQ$",
  artemisExpiryQueue: "^ExpiryQueue$",
  artemisBrowseBytesMessages: 99,
  artemisDefaultPageSize: 10,
  artemisMaxDiagramAddressSize: 20
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

  loadTablePageSize(storageLocation: string|undefined): number {
    const localStorageData = localStorage.getItem(storageLocation + PAGE_SIZE);
    if (localStorageData) {
        return Number(localStorageData);
    }
    return this.loadArtemisPreferences().artemisDefaultPageSize;
  }

  saveTablePageSize(storageLocation: string, size: number) {
    localStorage.setItem(storageLocation + PAGE_SIZE, size.toString());
  }

  resetPageSizes() {
    localStorage.removeItem(columnStorage.queues + PAGE_SIZE);
    localStorage.removeItem(columnStorage.addresses + PAGE_SIZE);
    localStorage.removeItem(columnStorage.connections + PAGE_SIZE);
    localStorage.removeItem(columnStorage.consumers + PAGE_SIZE);
    localStorage.removeItem(columnStorage.producers + PAGE_SIZE);
    localStorage.removeItem(columnStorage.sessions + PAGE_SIZE);
    localStorage.removeItem(columnStorage.messages + PAGE_SIZE);
  }

  private loadFromStorage(): Partial<ArtemisOptions> {
    const localStorageData = localStorage.getItem(STORAGE_KEY_ARTEMIS_PREFERENCES)

    return localStorageData ? JSON.parse(localStorageData) : {}
  }
}

export const artemisPreferencesService = new ArtemisPreferencesService()
