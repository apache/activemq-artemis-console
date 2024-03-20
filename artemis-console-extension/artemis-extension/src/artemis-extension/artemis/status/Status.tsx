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
import { ChartDonutUtilization } from "@patternfly/react-charts"
import { Card, 
    CardBody, 
    CardTitle, 
    Divider, 
    ExpandableSection, 
    Grid, 
    GridItem, 
    CardHeader, 
    TextList, 
    TextContent, 
    TextListItem, 
    TextListItemVariants,
    CardActions, 
    Dropdown, 
    KebabToggle, 
    DropdownItem, 
    Button, 
    Modal, 
    ModalVariant,
    Tooltip} from "@patternfly/react-core"
import { ExclamationCircleIcon, OkIcon } from '@patternfly/react-icons'
import { Attributes, eventService, Operations } from '@hawtio/react';
import { useContext, useEffect, useState } from "react";
import { Acceptors, artemisService, BrokerInfo, ClusterConnections } from "../artemis-service";
import { ArtemisContext } from "../context";
import { TableComposable, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";


export const Status: React.FunctionComponent = () => {

    const [brokerInfo, setBrokerInfo] = useState<BrokerInfo>()
    const [acceptors, setAcceptors] = useState<Acceptors>();
    const [clusterConnections, setClusterConncetions] = useState<ClusterConnections>()
    const { findAndSelectNode } = useContext(ArtemisContext)

    const [showAttributesDialog, setShowAttributesDialog] = useState(false);
    const [showOperationsDialog, setShowOperationsDialog] = useState(false);
    useEffect(() => {
        const getBrokerInfo = async () => {
            artemisService.createBrokerInfo()
                .then((brokerInfo) => {
                    setBrokerInfo(brokerInfo)
                })
                .catch((error: string) => {
                    eventService.notify({
                        type: 'warning',
                        message: error,
                    })
                });
        }

        const getAcceptors = async () => {
            artemisService.createAcceptors()
                .then((acceptors) => {
                    setAcceptors(acceptors)
                })
                .catch((error: string) => {
                    eventService.notify({
                        type: 'warning',
                        message: error,
                    })
                });
        }
        if (!brokerInfo) {
            getBrokerInfo();
        }

        if (!acceptors) {
            getAcceptors();
        }

        if (!clusterConnections) {
            artemisService.createClusterConnections()
                .then((clusterConnections) => {
                    setClusterConncetions(clusterConnections)
                })
                .catch((error: string) => {
                    eventService.notify({
                        type: 'warning',
                        message: error,
                    })
                });
        }

        const timer = setInterval(getBrokerInfo, 5000)
        return () => clearInterval(timer)

    }, [brokerInfo, acceptors, clusterConnections])

    const [isBrokerInfoOpen, setIsBrokerInfoOpen] = useState<boolean>(false);

    const onBrokerInfoSelect = () => {
        setIsBrokerInfoOpen(!isBrokerInfoOpen);
    };

    const openAttrubutes = async () => {
        const brokerObjectName = await artemisService.getBrokerObjectName();
        findAndSelectNode(brokerObjectName, "");
        setShowAttributesDialog(true);
    }

    const openOperations = async () => {
        const brokerObjectName = await artemisService.getBrokerObjectName();
        findAndSelectNode(brokerObjectName, "");
        setShowOperationsDialog(true);
    }


    const brokerInfoDropdownItems = [
        <DropdownItem key="attributes" component="button" onClick={() => openAttrubutes()}>
            Attributes
        </DropdownItem>,
        <DropdownItem key="operations" component="button" onClick={() => openOperations()}>
            Operations
        </DropdownItem>,
    ];

    return (
        <>
            <Grid hasGutter>
                <GridItem span={2} rowSpan={3}>
                    <Card isFullHeight={true} >
                        <CardHeader>
                            <CardTitle>Broker Info</CardTitle>
                            <CardActions>
                                <Dropdown
                                    onSelect={onBrokerInfoSelect}
                                    toggle={<KebabToggle onToggle={setIsBrokerInfoOpen} />}
                                    isOpen={isBrokerInfoOpen}
                                    isPlain
                                    dropdownItems={brokerInfoDropdownItems}
                                    position={'right'}
                                />
                            </CardActions>
                        </CardHeader>
                        <CardBody>
                            <Divider />
                            <TextContent>
                                <TextList isPlain>
                                    <TextListItem component={TextListItemVariants.dd}>Version: {brokerInfo?.version}</TextListItem>
                                    <TextListItem component={TextListItemVariants.dd}>Uptime: {brokerInfo?.uptime}</TextListItem>
                                    <TextListItem component={TextListItemVariants.dd}>Started: {""+brokerInfo?.started}</TextListItem>
                                    <TextListItem component={TextListItemVariants.dd}>HA Policy: {brokerInfo?.haPolicy}</TextListItem>
                                </TextList>
                            </TextContent>
                        </CardBody>
                    </Card>
                </GridItem>
                <GridItem span={3} rowSpan={3}>
                    <Card isFullHeight={true}>
                        <CardHeader>
                            <CardTitle>Address Memory Used</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Divider />
                            <ChartDonutUtilization
                                ariaDesc="Address Memory Used"
                                ariaTitle="Address Memory Used"
                                constrainToVisibleArea
                                data={{ x: 'Used:', y: brokerInfo?.addressMemoryUsed }}
                                labels={["Used: " + brokerInfo?.addressMemoryUsed.toFixed(2) + "%"]}
                                name="chart2"
                                padding={{
                                    bottom: 20,
                                    left: 20,
                                    right: 20,
                                    top: 20
                                }}
                                subTitle="MiB Used"
                                title={"" + brokerInfo?.addressMemoryUsage.toFixed(2)}
                                width={350} />
                        </CardBody>
                    </Card>
                </GridItem>
            </Grid>
            <ExpandableSection toggleTextExpanded="Acceptors" toggleTextCollapsed="Acceptors">
                <Grid hasGutter span={4}>
                    {
                        acceptors?.acceptors.map((acceptor, index) => (
                            <GridItem key={index}>
                                <Card isFullHeight={true} isFlat={true}>

                                    <CardTitle>{acceptor.Name} ({acceptor.FactoryClassName.indexOf("Netty") === -1?"VM":"TCP"}): {acceptor.Started && <Tooltip content={"Acceptor is Started"}><OkIcon color="green" /></Tooltip>}{!acceptor.Started && <Tooltip content={"Acceptor is Stopped"}><ExclamationCircleIcon color="red"/></Tooltip>}</CardTitle>
                                    <CardBody>
                                        <Divider />
                                        <TableComposable variant="compact" aria-label="Column Management Table">
                                        <Thead>
                                            <Tr key={"acceptor-list-param-title"}>
                                                <Th key={"acceptor-list-param-key" + index}>key</Th>
                                                <Th key={"acceptor-list-param-value" + index}>value</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                        {
                                            Object.keys(acceptor.Parameters).map((key, index) => {
                                                return (
                                                    <Tr key={"acceptor-list-param-val-" + index}>
                                                        <Td key={"acceptor-params-key-" + key}>{key}</Td>
                                                        <Td key={"acceptor-params-val-" + key}>{acceptor.Parameters[key]}</Td>
                                                    </Tr>

                                                )
                                            })
                                        }
                                        </Tbody>
                                        </TableComposable>
                                    </CardBody>
                                </Card>
                            </GridItem>
                        ))
                    }
                </Grid>
            </ExpandableSection>
            <ExpandableSection toggleText='Broker Network'>
                <Grid>
                    {
                        clusterConnections?.clusterConnections.map((clusterConnection, index) => (
                                <GridItem key={index} span={12}>
                                    <Card isFlat={true}>
                                        <CardTitle>{'Cluster(' + clusterConnection.Name + ')'}</CardTitle>
                                        <CardBody>
                                            <TableComposable variant="compact" aria-label="Coluster Table">
                                            <Thead>
                                                <Tr key={"cluster-list-row-" + index}>
                                                    <Th key={"cluster-list-param-key-name" + index}>name</Th>
                                                    <Th key={"cluster-list-param-key-nodeid" + index}>node id</Th>
                                                    <Th key={"cluster-list-param-key-address" + index}>address</Th>
                                                    <Th key={"cluster-list-param-key-started" + index}>started</Th>
                                                    <Th key={"cluster-list-param-key-lb" + index}>load balancing</Th>
                                                    <Th key={"cluster-list-param-key-ma" + index}>messages acknowledged</Th>
                                                    <Th key={"cluster-list-param-key-mh" + index}>max hops</Th>
                                                    <Th key={"cluster-list-param-key-dd" + index}>duplicate detection</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                <Tr key={"cluster-list-val-" + index}>
                                                    <Td key={"cluster-list-value-key-name" + index}>{clusterConnection.Name}</Td>
                                                    <Td key={"cluster-list-value-key-nodeid" + index}>{clusterConnection.NodeID}</Td>
                                                    <Td key={"cluster-list-value-key-address" + index}>{clusterConnection.Address}</Td>
                                                    <Td key={"cluster-list-value-key-started" + index}>{""+clusterConnection.Started}</Td>
                                                    <Td key={"cluster-list-value-key-lb" + index}>{clusterConnection.MessageLoadBalancingType}</Td>
                                                    <Td key={"cluster-list-value-key-ma" + index}>{clusterConnection.MessagesAcknowledged}</Td>
                                                    <Td key={"cluster-list-value-key-mh" + index}>{clusterConnection.MaxHops}</Td>
                                                    <Td key={"cluster-list-value-key-dd" + index}>{""+clusterConnection.DuplicateDetection}</Td>
                                                </Tr>
                                            </Tbody>
                                            </TableComposable>
                                        </CardBody>
                                    </Card>
                                </GridItem>
                        ))
                    }
                </Grid>
                <Grid hasGutter>
                    {
                        brokerInfo?.networkTopology.brokers.map((broker, index) => (
                            <GridItem key={index} span={3}>
                                <Card isFlat={true}>
                                    <CardTitle>{broker.nodeID}</CardTitle>
                                    <TableComposable variant="compact" aria-label="Network Table">
                                        <Thead>
                                            <Tr key={"network-row-title-" + index}>
                                                <Th key={"network-cell-primary-" + index}>primary</Th>
                                                <Th key={"network-cell-backup-" + index}>backup</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            <Tr key={"network-row-val-" + index}>
                                                <Td key={"network-val-primary-" + index}>{broker.live}</Td>
                                                <Td key={"network-val-backup-" + index}>{broker.backup}</Td>
                                            </Tr>
                                        </Tbody>
                                    </TableComposable>
                                </Card>
                            </GridItem>
                        ))
                    }
                </Grid>
            </ExpandableSection>

            <Modal
                aria-label='attributes-modal'
                variant={ModalVariant.medium}
                isOpen={showAttributesDialog}
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
                actions={[
                    <Button key="close" variant="primary" onClick={() => setShowOperationsDialog(false)}>
                        Close
                    </Button>
                ]}>
                <Operations />
            </Modal>
        </>
    )
}

