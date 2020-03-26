import * as React from 'react';
import ReactDOM from 'react-dom';

import { GraphView } from './lib/react-digraph';
import GraphConfig, {
  REGULAR_EDGE_TYPE,
  RECT_TYPE,
  CLUSTER_TYPE,
  NODE_KEY,
} from './graph-config'; // Configures node/edge types

import Tooltip from './components/tooltip';
import NodeEditor from './components/node-editor';

import Titlebar from './components/titlebar';
import {
  RenderNode,
  RenderNodeText,
  AfterRenderEdge,
} from './components/renderer/node-renderer';

class Graph extends React.Component {
  GraphView;

  state = {
    copiedNode: null,
    layoutEngine: 'SnapToGrid', // None
    writeLocked: false,
    graph: {
      name: 'default',
      edges: [],
      nodes: [],
    },
    selected: null,
    selectedNode: {},
    selectedStage: '',
    availableStages: [],
    stageSelector: '',
    hoveredNode: null,

    nodeEdtiorX: 0,
    nodeEdtiorY: 0,
  };

  mouseX = 0;
  mouseY = 0;

  tooltipContainer = null;

  // keep track of double-clicks in graph
  doubleClickPending = false;
  doubleClickTimeout = null;
  mouseMoveTimeout = null;

  constructor(props) {
    super(props);

    this.GraphView = React.createRef();
    this.toggleWriteLock = this.toggleWriteLock.bind(this);

    this.syncStages();

    // for debugging
    // TODO: remove
    window.gr = this;

    this.onChangeStage = this.onChangeStage.bind(this);
    this.onAddStage = this.onAddStage.bind(this);
    this.onUpdateStage = this.onUpdateStage.bind(this);
    this.onDeleteStage = this.onDeleteStage.bind(this);
    this.onNodeEditChange = this.onNodeEditChange.bind(this);
    this.onNodeEditExit = this.onNodeEditExit.bind(this);
  }

  toggleWriteLock() {
    this.setState({ writeLocked: !this.state.writeLocked });
  }

  syncStages() {
    fetch('http://localhost:8000/api/graph', {})
      .then(res => res.json())
      .then(data => {
        if (data.length == 0) {
          data = [
            {
              name: 'default',
              edges: [],
              nodes: [],
            },
          ];
          this.setState({
            selectedStage: 'default',
            availableStages: data,
            graph: data[0],
          });

          return;
        }

        this.setState({
          selectedStage: data[0].name,
          availableStages: data,
          graph: data[0],
        });
      });
  }

  onMouseMove(e) {
    this.mouseX = e.nativeEvent.offsetX;
    this.mouseY = e.nativeEvent.offsetY;

    if (this.mouseMoveTimeout) {
      clearTimeout(this.mouseMoveTimeout);
    }

    const tooltip = e.target.closest('#tooltip');
    const node = e.target.closest('g.node');
    let viewNode = null;

    // throttle state updates
    this.mouseMoveTimeout = setTimeout(() => {
      if (tooltip) {
        return;
      }

      if (node) {
        const id = node.getAttribute('id').replace('node-', '');

        viewNode = this.getViewNode(id);
      }

      if (viewNode != this.state.hoveredNode) {
        this.setState({
          hoveredNode: viewNode,
        });
      }
    }, 100);
  }

  // Helper to find the index of a given node
  getNodeIndex(searchNode) {
    return this.state.graph.nodes.findIndex(node => {
      return node[NODE_KEY] === searchNode[NODE_KEY];
    });
  }

  // Helper to find the index of a given node
  getNodeIndexById(id) {
    return this.state.graph.nodes.findIndex(node => {
      return node[NODE_KEY] === id;
    });
  }

  // Helper to find the index of a given edge
  getEdgeIndex(searchEdge) {
    return this.state.graph.edges.findIndex(edge => {
      return (
        edge.source === searchEdge.source && edge.target === searchEdge.target
      );
    });
  }

  // Given a nodeKey, return the corresponding node
  getViewNode(nodeKey) {
    const searchNode = {};

    searchNode[NODE_KEY] = nodeKey;
    const i = this.getNodeIndex(searchNode);

    return this.state.graph.nodes[i];
  }

  onUpdateNode = viewNode => {
    const graph = this.state.graph;
    const i = this.getNodeIndex(viewNode);

    // change other nodes aswell
    if (viewNode.type == 'cluster') {
      viewNode.children.forEach(c => {
        const i = this.getNodeIndexById(c);
        const node = graph.nodes[i];

        node.x += viewNode.dx;
        node.y += viewNode.dy;
        graph.nodes[i] = node;
      });
    }

    graph.nodes[i] = viewNode;
    graph.nodes = [...graph.nodes];
    this.setState({
      graph: graph,
    });

    this.GraphView.renderNodes();
  };

  onSelectNode = viewNode => {
    this.setState({ selectedEntity: viewNode });

    if (this.state.writeLocked) {
      this.setState({ selectedNode: {} });

      return;
    }

    if (viewNode == null) {
      return;
    }

    if (this.doubleClickPending) {
      this.doubleClickPending = false;
      clearTimeout(this.doubleClickTimeout);
      this.setState({
        selectedNode: viewNode,
        selectedEntity: {}, // disable node selection. we could accidentally delete it
        nodeEditEnabled: true,
        nodeEdtiorX: this.mouseX,
        nodeEdtiorY: this.mouseY,
      });
    } else {
      this.doubleClickPending = true;
      this.doubleClickTimeout = setTimeout(() => {
        this.doubleClickPending = false;
      }, 400);
    }
  };

  updateEdgeId(oldID, newID, edges) {
    return edges.map(edge => {
      if (edge.source == oldID) {
        edge.source = newID;
      }

      if (edge.target == oldID) {
        edge.target = newID;
      }

      return edge;
    });
  }

  onNodeEditChange(oldNode, node) {
    const graph = this.state.graph;
    const i = this.getNodeIndex(node);

    graph.nodes[i] = node;

    // create new reference
    graph.nodes = [...this.state.graph.nodes];
    graph.edges = [
      ...this.updateEdgeId(oldNode.id, node.id, this.state.graph.edges),
    ];

    this.setState({
      graph: graph,
      nodeEditEnabled: false,
      selectedNode: {},
    });
    this.GraphView.renderNodes();
  }

  onNodeEditExit() {
    this.setState({
      nodeEditEnabled: false,
      selectedNode: {},
    });
    this.GraphView.renderNodes();
  }

  onDeleteStage() {
    fetch(`http://localhost:8000/api/graph/${this.state.graph.id}`, {
      method: 'DELETE',
    }).then(this.syncStages.bind(this));
  }

  onUpdateStage(stageName) {
    if (!this.state.graph.id) {
      fetch(`http://localhost:8000/api/graph`, {
        method: 'POST',
        body: JSON.stringify(this.state.graph),
      })
        .then(res => res.json())
        .then(graph => {
          this.setState({
            selectedStage: stageName,
            graph,
          });
        });

      return;
    }

    fetch(`http://localhost:8000/api/graph/${this.state.graph.id}`, {
      method: 'POST',
      body: JSON.stringify(this.state.graph),
    });
  }

  onAddStage(stageName) {
    fetch(`http://localhost:8000/api/graph`, {
      method: 'POST',
      body: JSON.stringify({
        name: stageName,
        edges: [],
        nodes: [],
      }),
    })
      .then(res => res.json())
      .then(graph => {
        const { availableStages } = this.state;

        this.setState({
          selectedStage: stageName,
          availableStages: [{ name: stageName, graph }, ...availableStages],
          graph,
        });
      });
  }

  onChangeStage(name, stage) {
    this.setState({
      selectedStage: name,
      graph: stage,
    });
    setTimeout(() => {
      this.GraphView.handleZoomToFit();
    }, 50);
  }

  onSelectEdge = viewEdge => {
    this.setState({ selectedEntity: viewEdge });
  };

  onCreateNode = (x, y) => {
    const graph = this.state.graph;
    const type = RECT_TYPE;

    const viewNode = {
      id: Date.now().toString(),
      service_id: '',
      type,
      x,
      y,
    };

    graph.nodes = [...graph.nodes, viewNode];
    this.setState({ graph });
  };

  // Deletes a node from the graph
  onDeleteNode = (viewNode, nodeId, nodeArr) => {
    const graph = this.state.graph;
    // Delete any connected edges
    const newEdges = graph.edges.filter((edge, i) => {
      return (
        edge.source !== viewNode[NODE_KEY] && edge.target !== viewNode[NODE_KEY]
      );
    });

    graph.nodes = nodeArr;
    graph.edges = newEdges;

    this.setState({ graph, selected: null });
  };

  // Creates a new node between two edges
  onCreateEdge = (sourceViewNode, targetViewNode) => {
    const graph = this.state.graph;
    const type = REGULAR_EDGE_TYPE;

    const viewEdge = {
      source: sourceViewNode[NODE_KEY],
      target: targetViewNode[NODE_KEY],
      type,
    };

    // Only add the edge when the source node is not the same as the target
    if (viewEdge.source !== viewEdge.target) {
      graph.edges = [...graph.edges, viewEdge];
      this.setState({
        graph,
        selected: viewEdge,
      });
      this.GraphView.renderNodes();
    }
  };

  // Called when an edge is reattached to a different target.
  onSwapEdge = (sourceViewNode, targetViewNode, viewEdge) => {
    const graph = this.state.graph;
    const i = this.getEdgeIndex(viewEdge);
    const edge = JSON.parse(JSON.stringify(graph.edges[i]));

    edge.source = sourceViewNode[NODE_KEY];
    edge.target = targetViewNode[NODE_KEY];
    graph.edges[i] = edge;
    // reassign the array reference if you want the graph to re-render a swapped edge
    graph.edges = [...graph.edges];

    this.setState({
      graph,
      selected: edge,
    });
  };

  // Called when an edge is deleted
  onDeleteEdge = (viewEdge, edges) => {
    const graph = this.state.graph;

    graph.edges = edges;
    this.setState({
      graph,
      selected: null,
    });
  };

  nodeHasAlert(node, alerts) {
    return (
      alerts.find(alert => alert.labels.service_id == node.service_id) !==
      undefined
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.tooltipContainer) {
      ReactDOM.render(
        <div className="tooltip-wrapper">
          <Tooltip
            container={this.tooltipContainer}
            visible={
              !this.state.nodeEditEnabled &&
              this.state.hoveredNode != null &&
              this.state.hoveredNode.type !== CLUSTER_TYPE
            }
            node={this.state.hoveredNode}
            alerts={this.props.alerts}
            metrics={this.props.metrics}
          />
        </div>,
        this.tooltipContainer
      );
    }

    if (
      this.props.alerts != prevProps.alerts ||
      this.props.metrics != prevProps.metrics
    ) {
      this.GraphView.renderNodes();
    }
  }

  componentDidMount() {
    const containerId = `tooltip-container`;
    let tooltipContainer = document.getElementById(containerId);

    if (!tooltipContainer) {
      tooltipContainer = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'foreignObject'
      );
      tooltipContainer.classList.add('tooltip-container');
      // it must be within g.view so zoom and translation works
      this.GraphView.graphSvg.current.children[1].appendChild(tooltipContainer);
      this.tooltipContainer = tooltipContainer;
    }
  }

  render() {
    const { edges } = this.state.graph;
    const { nodes } = this.state.graph;
    const alerts = this.props.alerts || [];
    const metrics = this.props.metrics || [];
    const { NodeTypes, NodeSubtypes, EdgeTypes } = GraphConfig;

    // add extra class names to nodes which have an alert
    const annotatedNodes = [
      ...nodes
        .map(node => {
          node.extra_classes = node.extra_classes || [];

          if (this.nodeHasAlert(node, alerts)) {
            node.extra_classes = ['has-alert'];
          } else if (
            metrics.available_services &&
            metrics.available_services.includes(node.service_id)
          ) {
            node.extra_classes = ['is-ok'];
          }

          return node;
        })
        // cluster nodes must be last in the stack
        // otherwise referenced nodes are not rendered yet
        .sort((a, b) => (a.type == 'cluster' ? 1 : -1)),
    ];

    return (
      <div id="graph" onMouseMove={this.onMouseMove.bind(this)}>
        <Titlebar
          availableStages={this.state.availableStages}
          writeLocked={this.state.writeLocked}
          selectedStage={this.state.selectedStage}
          onChange={this.onChangeStage}
          onAdd={this.onAddStage}
          onUpdate={this.onUpdateStage}
          onDelete={this.onDeleteStage}
        />
        <NodeEditor
          x={this.state.nodeEdtiorX}
          y={this.state.nodeEdtiorY}
          onNodeEditChange={this.onNodeEditChange}
          onNodeEditExit={this.onNodeEditExit}
          enabled={this.state.nodeEditEnabled}
          node={this.state.selectedNode}
          nodes={this.state.graph.nodes}
        />
        <GraphView
          ref={el => (this.GraphView = el)}
          nodeKey={NODE_KEY}
          layoutEngineType={this.state.layoutEngine}
          nodes={annotatedNodes}
          edges={edges}
          selected={this.state.selectedEntity}
          nodeTypes={NodeTypes}
          nodeSubtypes={NodeSubtypes}
          edgeTypes={EdgeTypes}
          onSelectNode={this.onSelectNode}
          onCreateNode={this.onCreateNode}
          onUpdateNode={this.onUpdateNode}
          onDeleteNode={this.onDeleteNode}
          onSelectEdge={this.onSelectEdge}
          onCreateEdge={this.onCreateEdge}
          readOnly={this.state.writeLocked}
          onSwapEdge={this.onSwapEdge}
          onDeleteEdge={this.onDeleteEdge}
          renderNodeText={RenderNodeText}
          renderNode={RenderNode}
          afterRenderEdge={AfterRenderEdge}
          gridSpacing={36}
          gridDotSize={1}
        />
      </div>
    );
  }
}

export default Graph;
