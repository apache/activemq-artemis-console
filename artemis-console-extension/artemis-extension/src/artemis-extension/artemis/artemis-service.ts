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
import { ActiveSort, Filter } from './table/ArtemisTable'
import { jolokiaService, MBeanNode } from '@hawtio/react'
import { createAddressObjectName, createQueueObjectName } from './util/jmx'
import { contextNodeType, contextsType, domainNodeType, endpointNodeType, jmxDomain, log } from './globals'
import { Message } from './messages/MessageView'

export type BrokerInfo = {
    name: string
    nodeID: string
    objectName: string
    version: string
    started: string
    uptime: string
    globalMaxSizeMB: number
    addressMemoryUsage: number
    addressMemoryUsed: number
    haPolicy: string
    networkTopology: BrokerNetworkTopology
}

export class BrokerNetworkTopology {
    brokers: BrokerElement[];

    constructor(brokers: BrokerElement[]) {
        this.brokers = brokers;
    }

    getLiveCount(): number {
        return this.brokers.length;
    }

    getBackupCount(): number {
        var backups: number = 0;
        this.brokers.forEach((broker) => {
            if (broker.backup) {
                backups = backups + 1;
            }
        })
        return backups;
    }
}

export type BrokerElement = {
    nodeID: string
    live: string
    backup?: string
}

export type Acceptor = {
    Name: string
    FactoryClassName: string
    Started: boolean
    Parameters: any
}

export type Acceptors = {
    acceptors: Acceptor[]
}

export type ClusterConnection = {
    Started: boolean
    Address: string
    MessageLoadBalancingType: string
    MessagesAcknowledged: number
    Topology: string
    MaxHops: number
    Nodes: any
    Name: string
    DuplicateDetection: boolean
    DiscoveryGroupName: string
    Metrics: any
    MessagesPendingAcknowledgement: number
    StaticConnectors: string[]
    NodeID: string
    RetryInterval: number
    StaticConnectorsAsJSON: string
}

export type ClusterConnections = {
    clusterConnections: ClusterConnection[]
}

const BROKER_SEARCH_PATTERN = jmxDomain + ":broker=*";
const LIST_NETWORK_TOPOLOGY_SIG = "listNetworkTopology";
const SEND_MESSAGE_SIG = "sendMessage(java.util.Map,int,java.lang.String,boolean,java.lang.String,java.lang.String,boolean)";
const DELETE_ADDRESS_SIG = "deleteAddress(java.lang.String)";
const DELETE_MESSAGE_SIG = "removeMessage(long)";
const MOVE_MESSAGE_SIG = "moveMessage(long,java.lang.String)";
const CREATE_QUEUE_SIG = "createQueue(java.lang.String,boolean)"
const CREATE_ADDRESS_SIG = "createAddress(java.lang.String,java.lang.String)"
const COUNT_MESSAGES_SIG = "countMessages()";
const COUNT_MESSAGES_SIG2 = "countMessages(java.lang.String)";
const BROWSE_SIG = "browse(int,int,java.lang.String)";
const LIST_PRODUCERS_SIG = "listProducers(java.lang.String,int,int)";
const LIST_CONNECTIONS_SIG = "listConnections(java.lang.String,int,int)";
const LIST_SESSIONS_SIG = "listSessions(java.lang.String,int,int)";
const LIST_CONSUMERS_SIG = "listConsumers(java.lang.String,int,int)";
const LIST_ADDRESSES_SIG = "listAddresses(java.lang.String,int,int)";
const LIST_ALL_ADDRESSES_SIG = "listAddresses(java.lang.String)";
const LIST_QUEUES_SIG = "listQueues(java.lang.String,int,int)";
const DESTROY_QUEUE_SIG = "destroyQueue(java.lang.String)";
const REMOVE_ALL_MESSAGES_SIG = "removeAllMessages()";
const CLOSE_CONNECTION_SIG = "closeConnectionWithID(java.lang.String)";
const CLOSE_SESSION_SIG = "closeSessionWithID(java.lang.String,java.lang.String)";
const CLOSE_CONSUMER_SIG = "closeConsumerWithID(java.lang.String,java.lang.String)"

const MS_PER_SEC = 1000;
const MS_PER_MIN = 60 * MS_PER_SEC;
const MS_PER_HOUR = 60 * MS_PER_MIN;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const typeLabels = ["DEFAULT", "1", "object", "text", "bytes", "map", "stream", "embedded"];

class ArtemisService {

    private brokerObjectName: Promise<string>

    constructor() {
        this.brokerObjectName = this.initBrokerObjectName();
    }

    private async initBrokerObjectName(): Promise<string> {
        var search = await jolokiaService.search(BROKER_SEARCH_PATTERN);
        return search[0] ? search[0] : "";
    }



    async createBrokerInfo(): Promise<BrokerInfo> {
        return new Promise<BrokerInfo>(async (resolve, reject) => {
            var brokerObjectName = await this.brokerObjectName;
            var response = await jolokiaService.readAttributes(brokerObjectName);
            if (response) {
                var name = response.Name as string;
                var nodeID = response.NodeID as string;
                var version = response.Version as string;
                var started = "" + response.Started as string;
                var globalMaxSize = response.GlobalMaxSize as number;
                var addressMemoryUsage = response.AddressMemoryUsage as number;
                var uptime = response.Uptime as string;
                var used = 0;
                var haPolicy = response.HAPolicy as string;
                var addressMemoryUsageMB = 0;
                var globalMaxSizeMB = globalMaxSize / 1048576;
                if (addressMemoryUsage > 0) {
                    addressMemoryUsageMB = addressMemoryUsage / 1048576;
                    used = addressMemoryUsageMB / globalMaxSizeMB * 100
                }
                const topology = await jolokiaService.execute(brokerObjectName, LIST_NETWORK_TOPOLOGY_SIG) as string;
                var brokerInfo: BrokerInfo = {
                    name: name, objectName: brokerObjectName,
                    nodeID: nodeID,
                    version: version,
                    started: started,
                    uptime: uptime,
                    globalMaxSizeMB: globalMaxSizeMB,
                    addressMemoryUsage: addressMemoryUsageMB,
                    addressMemoryUsed: used,
                    haPolicy: haPolicy,
                    networkTopology: new BrokerNetworkTopology(JSON.parse(topology))
                };
                resolve(brokerInfo);
            }
            reject("invalid response:" + response);
        });
    }

    async createAcceptors(): Promise<Acceptors> {
        return new Promise<Acceptors>(async (resolve, reject) => {
            var brokerObjectName = await this.brokerObjectName;
            const acceptorSearch = brokerObjectName + ",component=acceptors,name=*";

            var search = await jolokiaService.search(acceptorSearch);
            if (search) {
                const acceptors: Acceptors = {
                    acceptors: []
                };
                for (var key in search) {
                    const acceptor: Acceptor = await jolokiaService.readAttributes(search[key]) as Acceptor;
                    acceptors.acceptors.push(acceptor);
                }
                resolve(acceptors);
            }
            reject("invalid response:");
        });
    }

    async createClusterConnections(): Promise<ClusterConnections> {
        return new Promise<ClusterConnections>(async (resolve, reject) => {
            var brokerObjectName = await this.brokerObjectName;
            const clusterConnectionSearch = brokerObjectName + ",component=cluster-connections,name=*";

            var search = await jolokiaService.search(clusterConnectionSearch);
            if (search) {
                const clusterConnections: ClusterConnections = {
                    clusterConnections: []
                };
                for (var key in search) {
                    const clusterConnection: ClusterConnection = await jolokiaService.readAttributes(search[key]) as ClusterConnection;
                    clusterConnections.clusterConnections.push(clusterConnection);
                }
                resolve(clusterConnections);
            }
            reject("invalid response:");
        });
    }

    async doSendMessageToQueue(body: string, theHeaders: { name: string; value: string }[], durable: boolean, createMessageId: boolean, useCurrentlogon: boolean, username: string, password: string, routingType: string, queue: string, address: string) {
        const mbean = createQueueObjectName(await this.getBrokerObjectName(), address, routingType, queue);
        return await this.doSendMessage(mbean, body, theHeaders, durable, createMessageId, useCurrentlogon, username, password);
    }

    async doSendMessageToAddress(body: string, theHeaders: { name: string; value: string }[], durable: boolean, createMessageId: boolean, useCurrentlogon: boolean, username: string, password: string, address: string) {
        const mbean = createAddressObjectName(await this.getBrokerObjectName(), address);
        return await this.doSendMessage(mbean, body, theHeaders, durable, createMessageId, useCurrentlogon, username, password);
    }

    async doSendMessage(mbean: string, body: string, theHeaders: { name: string; value: string }[], durable: boolean, createMessageId: boolean, useCurrentlogon: boolean, username: string, password: string) {
        var type = 3;
        var user = useCurrentlogon ? null : username;
        var pwd = useCurrentlogon ? null : password;
        var headers: { [id: string]: string; } = {};
        theHeaders.forEach(function (object) {
            var key = object.name;
            if (key) {
                headers[key] = object.value;
            }
        });
        log.debug("About to send headers: " + JSON.stringify(headers));
        return await jolokiaService.execute(mbean, SEND_MESSAGE_SIG, [headers, type, body, durable, user, pwd, createMessageId]);
    }


    async deleteAddress(address: string) {
        return await jolokiaService.execute(await this.getBrokerObjectName(), DELETE_ADDRESS_SIG, [address])
    }

    async deleteMessage(id: number, address: string, routingType: string, queue: string) {
        const mbean = createQueueObjectName(await this.getBrokerObjectName(), address, routingType, queue);
        return jolokiaService.execute(mbean, DELETE_MESSAGE_SIG, [id])
    }


    async moveMessage(id: number, targetQueue: string,  address: string, routingType: string, queue: string) {
        const mbean = createQueueObjectName(await this.getBrokerObjectName(), address, routingType, queue);
        return jolokiaService.execute(mbean, MOVE_MESSAGE_SIG, [id, targetQueue])
    }


    async createQueue(queueConfiguration: string) {
        return await jolokiaService.execute(await this.getBrokerObjectName(), CREATE_QUEUE_SIG, [queueConfiguration, false]).then().catch() as string;
    }
    
    async createAddress(address: string, routingType: string) {
        return await jolokiaService.execute(await this.getBrokerObjectName(), CREATE_ADDRESS_SIG, [address, routingType])
    }

    async getMessages(mBean: string, page: number, perPage: number, filter: string) {
        var count: number;
        if (filter && filter.length > 0) {
            count = await jolokiaService.execute(mBean, COUNT_MESSAGES_SIG2, [filter]) as number;
        } else {
            count = await jolokiaService.execute(mBean, COUNT_MESSAGES_SIG) as number;
        }
        const messages = await jolokiaService.execute(mBean, BROWSE_SIG, [page, perPage, filter]) as string;
        return {
            data: messages,
            count: count
        };
    }

    async getProducers(page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<string> {
        var producerFilter = {
            field: filter.input !== '' ? filter.column : '',
            operation: filter.input !== '' ? filter.operation : '',
            value: filter.input,
            sortOrder: activeSort.order,
            sortColumn: activeSort.id
        };
        return await jolokiaService.execute(await this.getBrokerObjectName(), LIST_PRODUCERS_SIG, [JSON.stringify(producerFilter), page, perPage]) as string;
    }

    async getConsumers(page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<string> {
        var consumerFilter = {
            field: filter.input !== '' ? filter.column : '',
            operation: filter.input !== '' ? filter.operation : '',
            value: filter.input,
            sortOrder: activeSort.order,
            sortColumn: activeSort.id
        };
        return await jolokiaService.execute(await this.getBrokerObjectName(), LIST_CONSUMERS_SIG, [JSON.stringify(consumerFilter), page, perPage]) as string;
    }

    async getConnections(page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<string> {
        var connectionsFilter = {
            field: filter.input !== '' ? filter.column : '',
            operation: filter.input !== '' ? filter.operation : '',
            value: filter.input,
            sortOrder: activeSort.order,
            sortColumn: activeSort.id
        };
        return await jolokiaService.execute(await this.getBrokerObjectName(), LIST_CONNECTIONS_SIG, [JSON.stringify(connectionsFilter), page, perPage]) as string;
    }

    async getSessions(page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<string> {
        var sessionsFilter = {
            field: filter.input !== '' ? filter.column : '',
            operation: filter.input !== '' ? filter.operation : '',
            value: filter.input,
            sortOrder: activeSort.order,
            sortColumn: activeSort.id
        };
        return await jolokiaService.execute(await this.getBrokerObjectName(), LIST_SESSIONS_SIG, [JSON.stringify(sessionsFilter), page, perPage]) as string;
    }

    async getAddresses(page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<string> {
        var addressesFilter = {
            field: filter.input !== '' ? filter.column : '',
            operation: filter.input !== '' ? filter.operation : '',
            value: filter.input,
            sortOrder: activeSort.order,
            sortColumn: activeSort.id
        };
        return await jolokiaService.execute(await this.getBrokerObjectName(), LIST_ADDRESSES_SIG, [JSON.stringify(addressesFilter), page, perPage]) as string;
    }

    async getAllAddresses(): Promise<string[]> {     
        return new Promise<string[]>(async (resolve, reject) => {
            var addressesString =  await jolokiaService.execute(await this.getBrokerObjectName(), LIST_ALL_ADDRESSES_SIG,  [',']) as string;
            if (addressesString) {
                resolve(addressesString.split(','));           
            }
            reject("invalid response:" + addressesString);
        });
    }

    async getQueues(page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<string> {
        var queuesFilter = {
            field: filter.input !== '' ? filter.column : '',
            operation: filter.input !== '' ? filter.operation : '',
            value: filter.input,
            sortOrder: activeSort.order,
            sortColumn: activeSort.id
        };
        return await jolokiaService.execute(await this.getBrokerObjectName(), LIST_QUEUES_SIG, [JSON.stringify(queuesFilter), page, perPage]) as string;
    }

    async getQueuesForAddress(address: string): Promise<string> {
        var queuesFilter = {
            field: 'address',
            operation: 'EQUALS',
            value: address
        };
        return await jolokiaService.execute(await this.getBrokerObjectName(), LIST_QUEUES_SIG, [JSON.stringify(queuesFilter), 1, 1000]) as string;
    }

    async deleteQueue(name: string) {
        return jolokiaService.execute(await this.getBrokerObjectName(), DESTROY_QUEUE_SIG, [name]);
    }

    async purgeQueue(name: string, address: string, routingType: string) {
        var queueMBean: string = createQueueObjectName(await this.getBrokerObjectName(), address, routingType, name);
        return jolokiaService.execute(queueMBean, REMOVE_ALL_MESSAGES_SIG);
    }

    async closeConnection(name: string) {
        return jolokiaService.execute(await this.getBrokerObjectName(), CLOSE_CONNECTION_SIG, [name]);
    }

    async closeSession(connection: string, name: string) {
        return jolokiaService.execute(await this.getBrokerObjectName(), CLOSE_SESSION_SIG, [connection, name]);
    }

    async closeConsumer(session: string, name: string) {
        return jolokiaService.execute(await this.getBrokerObjectName(), CLOSE_CONSUMER_SIG, [session, name]);
    }

    async getBrokerObjectName() {
        return await this.brokerObjectName;
    }


    getKeyByValue = (message: any, columnID: string): string => {
        if (columnID === "type") {
            const idx: number = message[columnID];
            return typeLabels[idx];
        }
        if (columnID === "timestamp") {
            const timestamp: number = message[columnID];
            return this.formatTimestamp(timestamp);
        }
        if (columnID === "expiration") {
            const timestamp: number = message[columnID];
            return this.formatExpires(timestamp, false);
        }
        if (columnID === "persistentSize") {
            const size: number = message[columnID];
            return this.formatPersistentSize(size);
        }
        if (columnID === "originalQueue" && message["StringProperties"]) {
            const originalQueue = message["StringProperties"]._AMQ_ORIG_QUEUE;
            return originalQueue ? originalQueue : "";
        }
        return message[columnID] ? "" + message[columnID] : "";
    }

    formatType = (message: Message) => {
        var typeLabels = ["default", "1", "object", "text", "bytes", "map", "stream", "embedded"];
        return message.type + " (" + typeLabels[message.type] + ")";
    }

    formatExpires = (timestamp: number, addTimestamp: boolean): string => {
        if (isNaN(timestamp) || typeof timestamp !== "number") {
            return "" + timestamp;
        }
        if (timestamp === 0) {
            return "never";
        }
        var expiresIn = timestamp - Date.now();
        if (Math.abs(expiresIn) < MS_PER_DAY) {
            var duration = expiresIn < 0 ? -expiresIn : expiresIn;
            var hours = this.pad2(Math.floor((duration / MS_PER_HOUR) % 24));
            var mins = this.pad2(Math.floor((duration / MS_PER_MIN) % 60));
            var secs = this.pad2(Math.floor((duration / MS_PER_SEC) % 60));
            var ret;
            if (expiresIn < 0) {
                // "HH:mm:ss ago"
                ret = hours + ":" + mins + ":" + secs + " ago";
            } else {
                // "in HH:mm:ss"
                ret = "in " + hours + ":" + mins + ":" + secs;
            }
            if (addTimestamp) {
                ret += ", at " + this.formatTimestamp(timestamp);
            }
            return ret;
        }
        return this.formatTimestamp(timestamp);
    }


    formatPersistentSize = (bytes: number) => {
        if (isNaN(bytes) || typeof bytes !== "number" || bytes < 0) return "N/A";
        if (bytes < 10240) return bytes.toLocaleString() + " Bytes";
        if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KiB";
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MiB";
        return (bytes / 1073741824).toFixed(2) + " GiB";
    }


    formatTimestamp = (timestamp: number): string => {
        if (isNaN(timestamp) || typeof timestamp !== "number") {
            return "" + timestamp;
        }
        if (timestamp === 0) {
            return "N/A";
        }
        var d = new Date(timestamp);
        // "yyyy-MM-dd HH:mm:ss"
        //add 1 to month as getmonth returns the position not the actual month
        return d.getFullYear() + "-" + this.pad2(d.getMonth() + 1) + "-" + this.pad2(d.getDate()) + " " + this.pad2(d.getHours()) + ":" + this.pad2(d.getMinutes()) + ":" + this.pad2(d.getSeconds());
    }

    pad2 = (value: number) => {
        return (value < 10 ? '0' : '') + value;
    }

    private DEBUG_PRIVS = true;
    canCreateQueue = (broker: MBeanNode | undefined): boolean => {
        return (this.DEBUG_PRIVS && broker?.hasInvokeRights(CREATE_QUEUE_SIG)) ?? false
    }

    canCreateAddress = (broker: MBeanNode | undefined): boolean => {
        return (this.DEBUG_PRIVS && broker?.hasInvokeRights(CREATE_ADDRESS_SIG) )?? false
    }

    canSendMessageToAddress = (broker: MBeanNode | undefined, address: string): boolean => {
        if(broker) {
            var addressMBean = broker.parent?.find(node => { 
                return node.propertyList?.get('component') === 'addresses' && node.propertyList?.get('subcomponent') === undefined && node.name === address 
            })
            return this.checkCanSendMessageToAddress(addressMBean as MBeanNode);
        }
        return false;
    }

    checkCanSendMessageToAddress = (addressMBean: MBeanNode | undefined): boolean => {
        return (this.DEBUG_PRIVS && addressMBean?.hasInvokeRights(SEND_MESSAGE_SIG)) ?? false;
    }

    canDeleteAddress = (broker: MBeanNode | undefined): boolean => {
        return (this.DEBUG_PRIVS && broker?.hasInvokeRights(DELETE_ADDRESS_SIG)) ?? false
    }

    canDeleteQueue = (broker: MBeanNode | undefined): boolean => {
        return (this.DEBUG_PRIVS && broker?.hasInvokeRights(DESTROY_QUEUE_SIG)) ?? false
    }

    canPurgeQueue = (broker: MBeanNode | undefined, queue: string): boolean => {
        if(broker) {
            var queueMBean = broker.parent?.find(node => { 
                return node.propertyList?.get('subcomponent') === 'queues' && node.name === queue 
            })
            return (this.DEBUG_PRIVS && queueMBean?.hasInvokeRights(REMOVE_ALL_MESSAGES_SIG)) ?? false;
        }
        return false;
    }

    canSendMessageToQueue = (broker: MBeanNode | undefined, queue: string): boolean => {
        if(broker) {
            var queueMBean = broker.parent?.find(node => { 
                return node.propertyList?.get('subcomponent') === 'queues' && node.name === queue 
            })
            return this.checkCanSendMessageToQueue(queueMBean as MBeanNode);
        }
        return false;
    }

    checkCanSendMessageToQueue = (queueMBean: MBeanNode | undefined): boolean => {
        return (this.DEBUG_PRIVS && queueMBean?.hasInvokeRights(SEND_MESSAGE_SIG)) ?? false;
    }

    canBrowseQueue = (broker: MBeanNode | undefined, queue: string): boolean => {
        if(broker) {
            var queueMBean = broker.parent?.find(node => { 
                return node.propertyList?.get('subcomponent') === 'queues' && node.name === queue 
            })
            return this.checkCanBrowseQueue(queueMBean as MBeanNode);
        }
        return false;
    }

    checkCanBrowseQueue = (queueMBean: MBeanNode ): boolean => {
        return (this.DEBUG_PRIVS && queueMBean?.hasInvokeRights(BROWSE_SIG)) ?? false;
    }


    findContext(node: MBeanNode): MBeanNode | null {
        if (!this.hasDomain(node)) return null
      
        if (this.isDomainNode(node)) {
          // The camel domain node so traverse to context folder & recurse
          return this.findContext(node.getIndex(0) as MBeanNode)
        }
      
        if (this.isContextsFolder(node)) {
          if (node.childCount() === 0) return null
      
          // Find first context node in the list
          return node.getIndex(0)
        }
      
        if (this.isContext(node)) {
          return node
        }
      
        // Node is below a context so navigate up the tree
        return node.findAncestor(ancestor => this.isContext(ancestor))
      }

      hasDomain(node: MBeanNode): boolean {
        return jmxDomain === node.getMetadata('domain')
      }
      
      isContextsFolder(node: MBeanNode): boolean {
        return this.hasDomain(node) && node.getType() === contextsType
      }

      isContext(node: MBeanNode): boolean {
        return this.hasDomain(node) && node.getType() === contextNodeType
      }

      isDomainNode(node: MBeanNode): boolean {
        return node.getType() === domainNodeType
      }

      isEndpointNode(node: MBeanNode): boolean {
        return this.hasDomain(node) && node.getType() === endpointNodeType
      }
}

export const artemisService = new ArtemisService()