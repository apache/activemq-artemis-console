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
import * as React from 'react';
import { ClusterIcon } from '@patternfly/react-icons';

import {
  ColaLayout,
  ComponentFactory,
  DefaultEdge,
  DefaultGroup,
  DefaultNode,
  DragObjectWithType,
  Edge,
  EdgeModel,
  EdgeStyle,
  Graph,
  GraphComponent,
  graphDropTargetSpec,
  GRAPH_LAYOUT_END_EVENT,
  groupDropTargetSpec,
  Layout,
  LayoutFactory,
  Model,
  ModelKind,
  Node,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  NodeModel,
  NodeShape,
  NodeStatus,
  SELECTION_EVENT,
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  withDndDrop,
  WithDndDropProps,
  withDragNode,
  WithDragNodeProps,
  withPanZoom,
  withSelection,
  WithSelectionProps,
  withTargetDrag,
  TopologySideBar
} from '@patternfly/react-topology';
import { useEffect, useState } from 'react';
import { artemisService, BrokerInfo } from '../artemis-service';
import { eventService } from '@hawtio/react';
import { ToolbarItem, Select, SelectVariant, SelectOption } from '@patternfly/react-core';


const BadgeColors = [
  {
    name: 'A',
    badgeColor: '#ace12e',
    badgeTextColor: '#0f280d',
    badgeBorderColor: '#486b00'
  },
  {
    name: 'B',
    badgeColor: '#F2F0FC',
    badgeTextColor: '#5752d1',
    badgeBorderColor: '#CBC1FF'
  },
  {
    name: 'Broker',
    badgeColor: '#c12766',
    badgeTextColor: 'white',
    badgeBorderColor: '#CBC1FF'
  },
  {
    name: 'Address',
    badgeColor: '#3e489f',
    badgeTextColor: 'white',
    badgeBorderColor: '#CBC1FF'
  },
  {
    name: 'Queue',
    badgeColor: '#50621d',
    badgeTextColor: 'white',
    badgeBorderColor: '#CBC1FF'
  },
  {
    name: 'Internal Address',
    badgeColor: 'white',
    badgeTextColor: 'black',
    badgeBorderColor: '#CBC1FF'
  },
  {
    name: 'Internal Queue',
    badgeColor: 'white',
    badgeTextColor: 'black',
    badgeBorderColor: '#CBC1FF'
  }
];

interface ControllerState {
  selectedIds: string[];
  viewOptions: ViewOptions;
}

type CustomNodeProps = {
  element: Node;
} & WithDragNodeProps;


const BrokerCustomNode: React.FC<CustomNodeProps & WithSelectionProps & WithDragNodeProps & WithDndDropProps> = ({ element, onSelect, selected, ...rest }) => {
  const data = element.getData();
  const Icon = ClusterIcon;
  const badgeColors = BadgeColors.find(badgeColor => badgeColor.name === data.badge);
  const { viewOptions } = element.getController().getState<ControllerState>();

  return (
    <DefaultNode 
      element={element}
      showStatusDecorator
      badge={data.badge}
      badgeColor={badgeColors?.badgeColor}
      badgeTextColor={badgeColors?.badgeTextColor}
      badgeBorderColor={badgeColors?.badgeBorderColor}
      showLabel={viewOptions.showLabels}
      className="artemisBroker"
      onSelect={onSelect}
      selected={selected}
      {...rest}
    >
      <g transform={`translate(25, 25)`}>
        <Icon style={{ color: '#393F44' }} width={25} height={25}></Icon>
      </g>
    </DefaultNode>
  );
};

const ResourceNode: React.FC<CustomNodeProps & WithSelectionProps & WithDragNodeProps & WithDndDropProps> = ({ element, onSelect, selected, ...rest  }) => {
  const data = element.getData();
  const badgeColors = BadgeColors.find(badgeColor => badgeColor.name === data.badge);
  const { viewOptions } = element.getController().getState<ControllerState>();

  return (
    <DefaultNode
      element={element}
      showStatusDecorator
      badge={data.badge}
      badgeColor={badgeColors?.badgeColor}
      badgeTextColor={badgeColors?.badgeTextColor}
      badgeBorderColor={badgeColors?.badgeBorderColor} 
      showLabel={viewOptions.showLabels}
      className={data.className}
      onSelect={onSelect}
      selected={selected}
      {...rest}
    >
    </DefaultNode>
  );
};

const customLayoutFactory: LayoutFactory = (type: string, graph: Graph): Layout | undefined => {
  switch (type) {
    case 'Cola':
      return new ColaLayout(graph);
    default:
      return new ColaLayout(graph, { layoutOnDrag: true });
  }
};

const CONNECTOR_TARGET_DROP = 'connector-target-drop';

const customComponentFactory: ComponentFactory = (kind: ModelKind, type: string): any => {
  switch (type) {
    case 'group':
      return withDndDrop(groupDropTargetSpec)(withDragNode(nodeDragSourceSpec('group'))(withSelection()(DefaultGroup)));
    default:
      switch (kind) {
        case ModelKind.graph:
          return withDndDrop(graphDropTargetSpec())(withPanZoom()(GraphComponent));
        case ModelKind.node:
          switch(type) {
            case 'broker':
              return withDndDrop(nodeDropTargetSpec([CONNECTOR_TARGET_DROP]))(
                withDragNode(nodeDragSourceSpec('node', true, true))(BrokerCustomNode));
            case 'resource':
              return withDndDrop(nodeDropTargetSpec([CONNECTOR_TARGET_DROP]))(
                withDragNode(nodeDragSourceSpec('node', true, true))(ResourceNode));
            default:
              return withDndDrop(nodeDropTargetSpec([CONNECTOR_TARGET_DROP]))(
                withDragNode(nodeDragSourceSpec('node', true, true))(ResourceNode));
          }
        case ModelKind.edge:
          return withTargetDrag<
            DragObjectWithType,
            Node,
            { dragging?: boolean },
            {
              element: Edge;
            }
          >({
            item: { type: CONNECTOR_TARGET_DROP },
            begin: (monitor, props) => {
              props.element.raise();
              return props.element;
            },
            drag: (event, monitor, props) => {
              props.element.setEndPoint(event.x, event.y);
            },
            end: (dropResult, monitor, props) => {
              if (monitor.didDrop() && dropResult && props) {
                props.element.setTarget(dropResult);
              }
              props.element.setEndPoint();
            },
            collect: monitor => ({
              dragging: monitor.isDragging()
            })
            // @ts-ignore
          })(DefaultEdge);
        default:
          return undefined;
      }
  }
};

const BROKER_NODE_DIAMETER = 75;
const ADDRESS_NODE_DIAMETER = 50;
const QUEUE_NODE_DIAMETER = 50;

const NODES: NodeModel[] = [];
const EDGES: EdgeModel[] = [];

interface ViewOptions {
  showLabels: boolean;
  showAddresses: boolean;
  showQueues: boolean;
  showInternalAddresses: boolean;
  showInternalQueues: boolean;
  showConnectors: boolean;
}

export const DefaultViewOptions: ViewOptions = {
  showLabels: true,
  showAddresses: true,
  showQueues: true,
  showInternalAddresses: false,
  showInternalQueues: false,
  showConnectors: true
};

function isInternalName(name: string, start=0) {
  // starts at position 1 when the name is surrounded with quotes
  return name.startsWith("$", start) || name.startsWith("notif", start);
}

export const BrokerTopology: React.FunctionComponent = () => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [viewOptionsOpen, setViewOptionsOpen] = useState<boolean>(false);
  const [viewOptions, setViewOptions] = React.useState<ViewOptions>(DefaultViewOptions);

  const controller = React.useMemo(() => {
    const model: Model = {
      nodes: NODES,
      edges: EDGES,
      graph: {
        id: 'g1',
        type: 'graph',
        layout: 'Cola'
      }
    };

    

    const newController = new Visualization();
    newController.registerLayoutFactory(customLayoutFactory);
    newController.registerComponentFactory(customComponentFactory);

    newController.addEventListener(SELECTION_EVENT, setSelectedIds);
    newController.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
      newController.getGraph().fit(80);
    });

    newController.fromModel(model, false);
    return newController;
  }, []);

  useEffect(() => {
    const getBrokerTopology = async () => {
        artemisService.createBrokerInfo()
            .then((brokerInfo) => {
                var brokerNode: NodeModel = {
                  id: brokerInfo.nodeID,
                  type: 'broker',
                  label: brokerInfo.name,
                  width: BROKER_NODE_DIAMETER,
                  height: BROKER_NODE_DIAMETER,
                  shape: NodeShape.ellipse,
                  status: NodeStatus.info,
                  style: {
                    fill: "black"
                  },
                  data: {
                    badge: 'Broker'
                  }
                }
                var newBrokerNodes: NodeModel[] = [];
                var newBrokerEdges: EdgeModel[] = [];
                newBrokerNodes.push(brokerNode);

                brokerInfo.networkTopology.brokers.forEach(broker => {
                  if (brokerInfo.nodeID !== broker.nodeID) {
                    var brokerNode: NodeModel = {
                      id: broker.nodeID,
                      type: 'broker',
                      label: broker.live,
                      width: BROKER_NODE_DIAMETER,
                      height: BROKER_NODE_DIAMETER,
                      shape: NodeShape.ellipse,
                      status: NodeStatus.info,
                      data: {
                        badge: 'Broker'
                      }
                    }
                    newBrokerNodes.push(brokerNode);
                    if (viewOptions.showConnectors) {
                      var brokerEdge: EdgeModel = {
                        id: 'broker-edge-' + brokerInfo.nodeID + '-broker-node-' + broker.nodeID,
                        type: 'edge',
                        source: brokerInfo.nodeID,
                        target: broker.nodeID,
                        edgeStyle: EdgeStyle.default
                      };
                      newBrokerEdges.push(brokerEdge);
                    }
                  }
                })

                const model: Model = {
                  nodes: newBrokerNodes,
                  edges: newBrokerEdges,
                  graph: {
                    id: 'g1',
                    type: 'graph',
                    layout: 'Cola'
                  }
                };
                artemisService.getAllAddresses()
                .then((addresses) => {
                  addresses.forEach(address => {
                      if (viewOptions.showAddresses) {
                        var internalAddress: boolean = isInternalName(address);
                        if(internalAddress && viewOptions.showInternalAddresses) {
                          addInternalAddress(address, newBrokerNodes, brokerInfo, newBrokerEdges, controller, model, viewOptions.showConnectors);
                        } else if (!internalAddress && viewOptions.showAddresses) {
                          addAddress(address, newBrokerNodes, brokerInfo, newBrokerEdges, controller, model, viewOptions.showConnectors);
                        }
                      }
                      if (viewOptions.showQueues) {
                        artemisService.getQueuesForAddress(address)
                          .then(queues => {
                            var parsedQueues: any[] = JSON.parse(queues).data;
                            parsedQueues.forEach(queue => {
                              if (internalAddress && viewOptions.showInternalQueues) {
                                addInternalQueue(address, queue.name, newBrokerNodes, brokerInfo, newBrokerEdges, controller, model, viewOptions.showInternalAddresses, viewOptions.showConnectors); 
                              } else if (!internalAddress &&viewOptions.showQueues) {
                                addQueue(address, queue.name, newBrokerNodes, brokerInfo, newBrokerEdges, controller, model, viewOptions.showAddresses, viewOptions.showConnectors); 
                              }
                            })
                          })}
                  });
                })         
            })
            .catch((error: string) => {
                eventService.notify({
                    type: 'warning',
                    message: error,
                })
            });
    }
    getBrokerTopology();

  }, [viewOptions, controller])



  const contextToolbar = (
    <ToolbarItem>
      <Select
        variant={SelectVariant.checkbox}
        customContent={
          <div>
            <SelectOption
              value="show Labels"
              isChecked={viewOptions.showLabels}
              onClick={() => setViewOptions(prev => ({ ...prev, showLabels: !prev.showLabels }))}
            />
            <SelectOption
              value="show Addresses"
              isChecked={viewOptions.showAddresses}
              onClick={() => setViewOptions(prev => ({ ...prev, showAddresses: !prev.showAddresses }))}
            />
            <SelectOption
              value="show Queues"
              isChecked={viewOptions.showQueues}
              onClick={() => setViewOptions(prev => ({ ...prev, showQueues: !prev.showQueues }))}
            />
            <SelectOption
              value="show Internal Addresses"
              isChecked={viewOptions.showInternalAddresses}
              onClick={() => setViewOptions(prev => ({ ...prev, showInternalAddresses: !prev.showInternalAddresses }))}
            />
            <SelectOption
              value="show Internal Queues"
              isChecked={viewOptions.showInternalQueues}
              onClick={() => setViewOptions(prev => ({ ...prev, showInternalQueues: !prev.showInternalQueues }))}
            />
            <SelectOption
              value="show Connectors"
              isChecked={viewOptions.showConnectors}
              onClick={() => setViewOptions(prev => ({ ...prev, showConnectors: !prev.showConnectors }))}
            />
          </div>
        }
        onToggle={() => setViewOptionsOpen(prev => !prev)}
        onSelect={() => {}}
        isCheckboxSelectionBadgeHidden
        isOpen={viewOptionsOpen}
        placeholderText="Node options"
      />
    </ToolbarItem>
  );

  const topologySideBar = (
    <TopologySideBar
      className="topology-example-sidebar"
      show={selectedIds.length > 0}
      onClose={() => setSelectedIds([])}
    >
      <div style={{ marginTop: 27, marginLeft: 20, height: '800px' }}>{selectedIds[0]}</div>
    </TopologySideBar>
  );

  return (
    <TopologyView contextToolbar={contextToolbar} sideBar={topologySideBar}>
      <VisualizationProvider controller={controller}>
        <VisualizationSurface state={{ selectedIds, viewOptions }} />
      </VisualizationProvider>
    </TopologyView>
  );
};

function addAddress(address: string, newBrokerNodes: NodeModel[], brokerInfo: BrokerInfo, newBrokerEdges: EdgeModel[], controller: Visualization, model: Model, showConnectors: boolean) {
  var addressNode: NodeModel = {
    id: 'address-node-' + address,
    type: 'resource',
    label: address,
    width: ADDRESS_NODE_DIAMETER,
    height: ADDRESS_NODE_DIAMETER,
    shape: NodeShape.ellipse,
    status: NodeStatus.info,
    data: {
      badge: 'Address',
      className: 'artemisAddress'
    }
  };
  newBrokerNodes.push(addressNode);
  if (showConnectors) {
    var addressEdge: EdgeModel = {
      id: 'address-edge-' + brokerInfo.nodeID + '-address-node-' + address,
      type: 'edge',
      source: brokerInfo.nodeID,
      target: 'address-node-' + address,
      edgeStyle: EdgeStyle.default
    };
    newBrokerEdges.push(addressEdge);
  }
  controller.fromModel(model, false);
}

function addInternalAddress(address: string, newBrokerNodes: NodeModel[], brokerInfo: BrokerInfo, newBrokerEdges: EdgeModel[], controller: Visualization, model: Model, showConnectors: boolean) {
  var addressNode: NodeModel = {
    id: 'address-node-' + address,
    type: 'resource',
    label: address,
    width: ADDRESS_NODE_DIAMETER,
    height: ADDRESS_NODE_DIAMETER,
    shape: NodeShape.ellipse,
    status: NodeStatus.info,
    data: {
      badge: 'Internal Address',
      className: 'artemisInternalAddress'
    }
  };
  newBrokerNodes.push(addressNode);
  if (showConnectors) {
    var addressEdge: EdgeModel = {
      id: 'address-edge-' + brokerInfo.nodeID + '-address-node-' + address,
      type: 'edge',
      source: brokerInfo.nodeID,
      target: 'address-node-' + address,
      edgeStyle: EdgeStyle.default
    };
    newBrokerEdges.push(addressEdge);
  }
  controller.fromModel(model, false);
}

function addQueue(address: string, queue: string, newBrokerNodes: NodeModel[], brokerInfo: BrokerInfo, newBrokerEdges: EdgeModel[], controller: Visualization, model: Model, showAddresses: boolean, showConnectors: boolean) {
  var queueNode: NodeModel = {
    id: 'queue-node-' + queue,
    type: 'resource',
    label: queue,
    width: QUEUE_NODE_DIAMETER,
    height: QUEUE_NODE_DIAMETER,
    shape: NodeShape.ellipse,
    status: NodeStatus.info,
    data: {
      badge: 'Queue',
      className: 'artemisQueue'
    }
  };
  newBrokerNodes.push(queueNode);
  if (showAddresses && showConnectors) {
    var queueEdge: EdgeModel = {
      id: 'queue-edge-address-node' + address + '-queue-node-' + queue,
      type: 'edge',
      source: 'address-node-' + address,
      target: 'queue-node-' + queue,
      edgeStyle: EdgeStyle.default
    };
    newBrokerEdges.push(queueEdge);
  }
  controller.fromModel(model, false);
}

function addInternalQueue(address: string, queue: string, newBrokerNodes: NodeModel[], brokerInfo: BrokerInfo, newBrokerEdges: EdgeModel[], controller: Visualization, model: Model, showInternalAddresses: boolean, showConnectors: boolean) {
  var queueNode: NodeModel = {
    id: 'queue-node-' + queue,
    type: 'resource',
    label: queue,
    width: QUEUE_NODE_DIAMETER,
    height: QUEUE_NODE_DIAMETER,
    shape: NodeShape.ellipse,
    status: NodeStatus.info,
    data: {
      badge: 'Internal Queue',
      className: 'artemisInternalAddress'
    }
  };
  newBrokerNodes.push(queueNode);
  if (showInternalAddresses && showConnectors) {
    var queueEdge: EdgeModel = {
      id: 'queue-edge-address-node' + address + '-queue-node-' + queue,
      type: 'edge',
      source: 'address-node-' + address,
      target: 'queue-node-' + queue,
      edgeStyle: EdgeStyle.default
    };
    newBrokerEdges.push(queueEdge);
  }
  controller.fromModel(model, false);
}

