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
import { MBeanNode, MBeanTree, PluginTreeViewToolbar } from '@hawtio/react'
import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import React, { ChangeEvent, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArtemisContext } from './context'
import { artemisJMXPluginPath } from './globals'

/**
 * Expansion requires more than 2 states since the expandAll
 * must be removed completely to defer to the expanded state
 * of each data node
 */
enum ExpansionValue {
  /**
   * should revert to the expanded state of the data
   */
  Default,
  /**
   * all data should be expanded
   */
  ExpandAll,
  /**
   * all data should be collapsed
   */
  CollapseAll,
}

export const ArtemisTreeView: React.FunctionComponent = () => {
  const { tree, selectedNode, setSelectedNode } = useContext(ArtemisContext)
  const [expanded, setExpanded] = useState(ExpansionValue.Default)
  const navigate = useNavigate()

  const [filteredTree, setFilteredTree] = useState(tree.getTree())

  /**
   * Listen for changes to the tree that may occur as a result
   * of events being monitored by the Tree:Watcher in workspace
   * eg. new endpoint being created
   */
  useEffect(() => {
    setFilteredTree(tree.getTree())
  }, [tree])

  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    // Ensure no node from the 'old' filtered is lingering
    setSelectedNode(null)
    setExpanded(ExpansionValue.Default)

    const input = event.target.value
    if (input === '') {
      setFilteredTree(tree.getTree())
    } else {
      setFilteredTree(
        MBeanTree.filter(tree.getTree(), (node: MBeanNode) => node.name.toLowerCase().includes(input.toLowerCase())),
      )
      setExpanded(ExpansionValue.ExpandAll)
    }
  }

  const onSelect = (event: React.MouseEvent<Element, MouseEvent>, item: TreeViewDataItem) => {
    setSelectedNode(item as MBeanNode)
    /* On change of node selection update the url to the base plugin path */ 
    navigate(artemisJMXPluginPath)
  }

  const getActiveItems = (): TreeViewDataItem[] => {
    if (!selectedNode) {
      return []
    } else {
      return [selectedNode as TreeViewDataItem]
    }
  }

  const setAllExpanded = (value: boolean) => {
    setExpanded(value ? ExpansionValue.ExpandAll : ExpansionValue.CollapseAll)
  }

  const expandedProp = (): object => {
    switch (expanded) {
      case ExpansionValue.ExpandAll:
        return { allExpanded: true }
      case ExpansionValue.CollapseAll:
        return { allExpanded: false }
      default:
        return {}
    }
  }

  return (
    <TreeView
      id='artemis-tree-view'
      data={filteredTree}
      hasGuides={true}
      onSelect={onSelect}
      hasSelectableNodes={true}
      activeItems={getActiveItems()}
      {...expandedProp()}
      toolbar={<PluginTreeViewToolbar onSearch={onSearch} onSetExpanded={setAllExpanded} />}
    />
  )
}
