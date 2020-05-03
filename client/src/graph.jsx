import * as d3 from 'd3';
import ReactDOM from 'react-dom';
import * as React from 'react';
import './graph.scss';
import Dialog from './components/dialog';
import AddStage from './components/stage-add';
import EditStage from './components/stage-edit';
import BtnTooltip from './components/btn-tooltip';
import Select from 'react-select';

import DebugComponent from './lib/debug-component';
import {
  Rect,
  Cluster,
  Pointer,
  Edge,
  NodeEditor,
  Tooltip,
  GraphUtils,
} from './internal';

import { RenderLayerMap, LAYER_EDGE } from './config';
import {
  updateActiveGraphAction,
  createGraph,
  saveActiveGraph,
} from './store/actions/graph-collection';

class Graph extends DebugComponent {
  static defaultProps = {
    maxZoom: 1.5,
    minZoom: 0.5,
    zoomDelay: 1000,
    zoomDur: 750,
  };

  state = {
    hoveredNode: null,
    draggingEdge: null,
    writeLocked: false,
    modalContent: null,
    editorNode: null,
    selectedStage: null,
  };

  renderNodesTimeout = null;
  renderEdgesTimeout = null;
  hoverNodeTimeout = null;
  nodeTimeouts = {};
  edgeTimeouts = {};

  renderLayer = RenderLayerMap;

  background = {
    width: 40960,
    height: 40960,
  };

  constructor(props) {
    super(props);
    this.viewWrapper = React.createRef();
    this.view = React.createRef();

    // TODO remove debug
    window.gr = this;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.tooltipContainer) {
      ReactDOM.render(
        <div className="tooltip-wrapper">
          <Tooltip
            container={this.tooltipContainer}
            visible={!this.state.selectedNode && this.state.hoveredNode != null}
            node={this.state.hoveredNode}
            alerts={this.props.alerts}
            metrics={this.props.metrics}
            mapping={this.props.mapping}
          />
        </div>,
        this.tooltipContainer
      );
    }

    if (
      this.props.alerts != prevProps.alerts ||
      this.props.metrics != prevProps.metrics ||
      this.props.graphCollection != prevProps.graphCollection ||
      this.props.activeGraph != prevProps.activeGraph
    ) {
      this.renderNodes();
      this.renderEdges();
    }
  }

  componentDidMount() {
    const { zoomDelay, minZoom, maxZoom } = this.props;

    document.addEventListener('keydown', this.handleWrapperKeydown.bind(this));
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    this.zoom = d3
      .zoom()
      //.filter(this.zoomFilter)
      .scaleExtent([minZoom || 0, maxZoom || 0])
      .on('start', () => {
        this.handleZoomStart(d3.event);
      })
      .on('zoom', () => {
        this.handleZoom(d3.event);
      })
      .on('end', this.handleZoomEnd);

    d3.select(this.viewWrapper.current)
      .on('touchstart', this.containZoom)
      .on('touchmove', this.containZoom)
      .on('click', () => {
        this.handleSvgClicked(d3.event);
      })
      .select('svg')
      .call(this.zoom);

    this.selectedView = d3.select(this.view);

    this.renderView();
    setTimeout(() => {
      if (this.viewWrapper.current != null) {
        this.handleZoomToFit();
      }
    }, zoomDelay);

    let tooltipContainer = document.getElementById(`tooltip-container`);

    if (!tooltipContainer) {
      tooltipContainer = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'foreignObject'
      );
      tooltipContainer.classList.add('tooltip-container');
      // it must be within g.view so zoom and translation works
      this.view.appendChild(tooltipContainer);
      this.tooltipContainer = tooltipContainer;
    }
  }

  handleWrapperKeydown(e) {
    if (this.state.writeLocked) {
      return;
    }

    if (e.key == 'Escape') {
      this.setState({
        editorNode: null,
        selectedEdge: null,
        draggingEdge: null,
      });
      this.clearModal();
    }

    if (['Backspace', 'Delete'].includes(e.key) && !this.state.editorNode) {
      this.removeNodeByID(this.state.selectedNode);
      this.removeEdgeByID(this.state.selectedEdge);
      this.renderNodes();
      this.renderEdges();
    }
  }

  handleDocumentClick(e) {}

  handleSvgClicked(event) {
    const { hoveredNode } = this.state;
    const { shiftKey } = event;
    const coords = d3.mouse(d3.event.target);

    if (this.state.writeLocked) {
      return;
    }

    this.setState({ selectedNode: hoveredNode ? hoveredNode.id : null });

    if (shiftKey) {
      const x = GraphUtils.gridify(coords[0] - 50);
      const y = GraphUtils.gridify(coords[1] - Rect.height / 2);

      this.createNode(Rect.new(x, y, 'node'));
    }

    this.setState({
      selectedEdge: null,
    });

    this.renderEdges();
    this.renderNodes();
  }

  onUpdateNodePosition = (nodeData, newNodePos, pointerPos, shift) => {
    const node = GraphUtils.getNodeByID(
      this.props.activeGraph.nodes,
      nodeData.id
    );
    const { draggingEdge, writeLocked } = this.state;

    if (writeLocked) {
      return;
    }

    newNodePos = GraphUtils.getGridPosition(newNodePos);

    this.setState({
      selectedEdge: null,
      selectedNode: node.id,
    });

    if (!shift) {
      if (draggingEdge) {
        this.setState({ draggingEdge: false });
        this.removeDraggingEdgeContainer(draggingEdge);
      }

      // here, we give control to the node to update other
      // node/edges in the graph
      if (node.type.hasOwnProperty('onUpdateNodeHook')) {
        const g = node.type.onUpdateNodeHook(
          this.props.activeGraph,
          nodeData,
          newNodePos
        );

        this.props.dispatch(updateActiveGraphAction(g));
      }

      Object.assign(node.bounds, { x: newNodePos.x, y: newNodePos.y });
      this.renderNodes();
      this.renderEdges();

      return;
    } else {
      if (!draggingEdge) {
        this.setState({
          draggingEdge: null,
        });
      }

      this.setState({
        draggingEdge: Edge.new(
          {
            type: node.type,
            id: node.id,
          },
          {
            type: Pointer,
            coords: {
              x: pointerPos.x,
              y: pointerPos.y,
            },
          }
        ),
      });
    }

    this.renderEdges();
    this.renderNodes();
  };

  onNodeMouseOver = node => {
    cancelAnimationFrame(this.hoverNodeTimeout);
    this.hoverNodeTimeout = requestAnimationFrame(() => {
      this.setState({ hoveredNode: node });
      this.renderEdges();
    });
  };
  onNodeMouseOut = node => {
    cancelAnimationFrame(this.hoverNodeTimeout);
    this.hoverNodeTimeout = requestAnimationFrame(() => {
      this.setState({ hoveredNode: null });
      this.renderEdges();
    });
  };

  onNodeDragEnd = node => {
    const { activeGraph } = this.props;
    const { draggingEdge, hoveredNode } = this.state;

    const oldDragging = Object.assign({}, draggingEdge);

    if (this.state.writeLocked) {
      return;
    }

    if (draggingEdge) {
      if (hoveredNode) {
        draggingEdge.target = {
          type: hoveredNode.type,
          id: hoveredNode.id,
        };

        if (hoveredNode.type.hasOwnProperty('getConnector')) {
          const connector = hoveredNode.type.getConnector(hoveredNode);

          if (!connector) {
            console.warn(`must connect to service port`);
            this.setState({
              draggingEdge: null,
            });
            this.removeDraggingEdgeContainer(oldDragging);

            return;
          }

          draggingEdge.target.connector = connector.id;
        }

        // check if edge already exists
        if (!this.edgeExists(draggingEdge)) {
          activeGraph.edges = [draggingEdge, ...activeGraph.edges];
        }
      }

      this.props.dispatch(updateActiveGraphAction(activeGraph));
      this.setState({
        draggingEdge: null,
      });
      this.removeDraggingEdgeContainer(oldDragging);
      this.renderEdges();
    }

    node.bounds = GraphUtils.getGridPosition(node.bounds);
    this.renderEdges();
    this.renderNodes();
  };

  edgeExists(e) {
    const { activeGraph } = this.props;

    return (
      activeGraph.edges.find(edge => {
        return (
          edge.source.id == e.source.id &&
          edge.target.id == e.target.id &&
          edge.target.connector == e.target.connector &&
          edge.source.connector == e.source.connector
        );
      }) !== undefined
    );
  }

  onNodeDoubleClick = (node, x, y) => {
    if (this.state.writeLocked) {
      return;
    }

    this.setState({
      editorNode: node,
      modalContent: (
        <NodeEditor
          onNodeEditChange={this.onNodeEditChange}
          onNodeEditExit={this.onNodeEditExit}
          node={node}
          nodes={this.props.activeGraph.nodes}
        />
      ),
    });
  };

  removeDraggingEdgeContainer(edge) {
    const id = this.getEdgeContainerID(edge);
    const container = document.getElementById(id);

    if (container) {
      container.remove();
    }
  }

  createNode(node) {
    const { activeGraph } = this.props;

    activeGraph.nodes = [node, ...activeGraph.nodes];
    this.props.dispatch(updateActiveGraphAction(activeGraph));
    this.renderNodes();
  }

  modifyZoom = (modK = 0, modX = 0, modY = 0, dur = 0) => {
    const parent = d3.select(this.viewWrapper.current).node();
    const center = {
      x: parent.clientWidth / 2,
      y: parent.clientHeight / 2,
    };
    const extent = this.zoom.scaleExtent();
    const viewTransform = this.state.viewTransform;

    const next = {
      k: viewTransform.k,
      x: viewTransform.x,
      y: viewTransform.y,
    };

    const targetZoom = next.k * (1 + modK);

    next.k = targetZoom;

    if (targetZoom < extent[0] || targetZoom > extent[1]) {
      return false;
    }

    const translate0 = {
      x: (center.x - next.x) / next.k,
      y: (center.y - next.y) / next.k,
    };

    const l = {
      x: translate0.x * next.k + next.x,
      y: translate0.y * next.k + next.y,
    };

    next.x += center.x - l.x + modX;
    next.y += center.y - l.y + modY;
    this.setZoom(next.k, next.x, next.y, dur);

    return true;
  };

  // Programmatically resets zoom
  setZoom(k = 1, x = 0, y = 0, dur = 0) {
    const t = d3.zoomIdentity.translate(x, y).scale(k);

    d3.select(this.viewWrapper.current)
      .select('svg')
      .transition()
      .duration(dur)
      .call(this.zoom.transform, t);
  }

  handleZoomStart = event => {};

  handleZoomToFit = () => {
    const entities = d3
      .select(this.entities)
      .select('.layer-node')
      .node();

    if (!entities) {
      return;
    }

    let viewBBox = entities.getBBox();

    if (entities.children.length == 0) {
      viewBBox = {
        x: this.background.width / 4,
        y: this.background.height / 4,
        width: 500,
        height: 80,
      };
    }

    this.handleZoomToFitImpl(viewBBox, this.props.zoomDur);
  };

  handleZoom = event => {
    const transform = event.transform;

    d3.select(this.view).attr('transform', transform);

    // prevent re-rendering on zoom
    if (this.state.viewTransform !== transform) {
      this.setState({
        viewTransform: transform,
      });
    }
  };

  handleZoomToFitImpl = (viewBBox, zoomDur = 0) => {
    if (!this.viewWrapper.current) {
      return;
    }

    const parent = d3.select(this.viewWrapper.current).node();
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    const minZoom = this.props.minZoom || 0;
    const maxZoom = this.props.maxZoom || 2;

    const next = {
      k: (minZoom + maxZoom) / 2,
      x: -width / 2,
      y: -height / 2,
    };

    if (viewBBox.width > 0 && viewBBox.height > 0) {
      // There are entities
      const dx = viewBBox.width;
      const dy = viewBBox.height;
      const x = viewBBox.x + viewBBox.width / 2;
      const y = viewBBox.y + viewBBox.height / 2;

      next.k = 0.9 / Math.max(dx / width, dy / height);

      if (next.k < minZoom) {
        next.k = minZoom;
      } else if (next.k > maxZoom) {
        next.k = maxZoom;
      }

      next.x = width / 2 - next.k * x;
      next.y = height / 2 - next.k * y;
    }

    this.setZoom(next.k, next.x, next.y, zoomDur);
  };

  renderView() {
    this.selectedView.attr('transform', this.state.viewTransform);

    clearTimeout(this.renderNodesTimeout);
    this.renderNodesTimeout = setTimeout(this.renderNodes);

    clearTimeout(this.renderEdgesTimeout);
    this.renderEdgesTimeout = setTimeout(this.renderEdges);
  }

  renderNodes = () => {
    if (
      !this.entities ||
      !this.props.activeGraph ||
      !this.props.activeGraph.nodes
    ) {
      return;
    }

    // we must render the cluster nodes AFTER all other
    this.props.activeGraph.nodes
      .sort(n => (n.type == Cluster ? 1 : -1))
      .sort((a, b) => {
        if (a.type == Cluster && b.type == Cluster) {
          return a.children.length > b.children.length ? 1 : -1;
        }

        return 1;
      })
      .forEach((node, i) => {
        cancelAnimationFrame(this.nodeTimeouts[node.id]);
        this.nodeTimeouts[node.id] = requestAnimationFrame(() => {
          this.renderNode(node);
        });
      });
  };

  renderEdges = () => {
    const { edges } = this.props.activeGraph;
    const { draggingEdge } = this.state;

    if (!this.entities || !edges) {
      return;
    }

    edges.forEach(edge => {
      if (!edge.source) {
        console.warn(`edge missing source`, edge);

        return;
      }

      const timeoutId = `${edge.source.id}-${edge.source.connector}|${edge.target.id}-${edge.target.connector}`;

      cancelAnimationFrame(this.edgeTimeouts[timeoutId]);
      this.edgeTimeouts[timeoutId] = requestAnimationFrame(() => {
        this.syncRenderEdge(edge);
      });
    });

    if (draggingEdge) {
      const tid = 'dragging-edge';

      cancelAnimationFrame(this.edgeTimeouts[tid]);
      this.edgeTimeouts[tid] = requestAnimationFrame(() => {
        this.syncRenderEdge(draggingEdge);
      });
    }
  };

  renderNode(node) {
    if (!this.entities) {
      return null;
    }

    const { selectedNode } = this.state;

    const highlightState = this.getHighlight(node);

    const element = (
      <node.type
        node={node}
        writeLocked={this.state.writeLocked}
        selected={selectedNode == node.id}
        highlight={highlightState}
        onUpdatePosition={this.onUpdateNodePosition}
        onMouseOver={this.onNodeMouseOver}
        onMouseOut={this.onNodeMouseOut}
        onDoubleClick={this.onNodeDoubleClick}
        onDragEnd={this.onNodeDragEnd}
      />
    );

    const containerId = GraphUtils.getNodeContainerById(node.id);
    let nodeContainer = document.getElementById(containerId);

    if (!nodeContainer) {
      nodeContainer = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
      );
      nodeContainer.id = containerId;
      const layer = GraphUtils.getRenderLayer(node.type);

      this.renderLayer[layer].appendChild(nodeContainer);
    }

    ReactDOM.render(element, nodeContainer);
  }

  getHighlight(node) {
    const { alerts, services, mapping } = this.props;

    if (!node) {
      return '';
    }

    if (!mapping) {
      return '';
    }

    // the alert map have csv in their service label
    const hasAlert =
      alerts.find(alert => {
        let found = false;

        // check if labels match
        mapping.alerts.service_labels.forEach(key => {
          if (!alert.labels || !alert.labels[key]) {
            return false;
          }

          const svcs = alert.labels[key]
            .split(',')
            .map(x => x.trim().toLowerCase());

          if (svcs.includes(node.name.toLowerCase())) {
            found = true;
          }
        });

        if (found) {
          return true;
        }

        // check if annotations match
        mapping.alerts.service_annotations.forEach(key => {
          if (!alert.annotations || !alert.annotations[key]) {
            return false;
          }

          const svcs = alert.annotations[key]
            .split(',')
            .map(x => x.trim().toLowerCase());

          if (svcs.includes(node.name.toLowerCase())) {
            found = true;
          }
        });

        return found;
      }) !== undefined;

    if (hasAlert) {
      return 'alert';
    }

    if (!services.available_services) {
      return '';
    }

    // ["foo,bar", "baz"] => does it include "foo"?
    return services.available_services
      .map(x =>
        x
          .toLowerCase()
          .split(',')
          .map(inner => inner.trim())
          .includes(node.name.toLowerCase())
      )
      .includes(true)
      ? 'ok'
      : '';
  }

  removeNodeByID(id) {
    if (!id) {
      return;
    }

    const { activeGraph } = this.props;

    // remove node from dom
    const containerId = GraphUtils.getNodeContainerById(id);
    const nodeContainer = document.getElementById(containerId);

    if (!nodeContainer) {
      console.warn(`trying to remove node with missing container`);

      return;
    }

    // remove edges
    activeGraph.edges
      .filter(edge => edge.source.id == id || edge.target.id == id)
      .forEach(edge => this.removeEdgeByID(edge.id));

    nodeContainer.remove();

    activeGraph.nodes = activeGraph.nodes.map(node => {
      if (node.children && node.children.includes(id)) {
        node.children = node.children.filter(cid => cid != id);
      }

      return node;
    });

    // update state
    activeGraph.nodes = [...activeGraph.nodes.filter(node => node.id != id)];
    this.props.dispatch(updateActiveGraphAction(activeGraph));
  }

  removeEdgeByID(id) {
    if (!id) {
      return;
    }

    const edge = GraphUtils.getEdgeByID(this.props.activeGraph.edges, id);
    const eci = this.getEdgeContainerID(edge);
    const container = document.getElementById(eci);

    if (!container) {
      console.warn(`trying to remove edge with missing container`);

      return;
    }

    container.remove();
    const { activeGraph } = this.props;

    activeGraph.edges = [...activeGraph.edges.filter(edge => edge.id != id)];
    this.props.dispatch(updateActiveGraphAction(activeGraph));
  }

  syncRenderEdge(edge) {
    // eslint-disable-next-line
    const [sourceID, from] = this.getEdgeCoords('source', edge.source);
    const [targetID, to] = this.getEdgeCoords('target', edge.target);
    const id = `edge-${sourceID}-${targetID}`;

    if (sourceID === false || targetID === false) {
      console.warn(`connection not possible`);

      return;
    }

    if (!edge.type) {
      console.warn(`trying to render edge without type`, edge);
    }

    let isSelected = this.state.selectedEdge == edge.id;

    if (
      edge.target.id == this.state.selectedNode ||
      edge.source.id == this.state.selectedNode
    ) {
      isSelected = true;
    }

    let highlight = '';

    if (
      this.state.hoveredNode &&
      (this.state.hoveredNode.id == edge.target.id ||
        this.state.hoveredNode.id == edge.source.id)
    ) {
      const sNode = GraphUtils.getNodeByID(
        this.props.activeGraph.nodes,
        edge.source.id
      );
      const dNode = GraphUtils.getNodeByID(
        this.props.activeGraph.nodes,
        edge.target.id
      );

      if (
        this.getHighlight(sNode) == 'alert' ||
        this.getHighlight(dNode) == 'alert'
      ) {
        highlight = 'alert';
      } else {
        highlight = 'ok';
      }
    }

    const element = (
      <edge.type
        edge={edge}
        from={from}
        to={to}
        onClick={this.onClickEdge}
        selected={isSelected}
        highlight={highlight}
      />
    );

    this.renderEdge(id, element, edge);

    // this allows to change the Node after edge is drawn
    const ctr = edge.target.type;

    if (ctr && ctr.hasOwnProperty('afterRenderEdge')) {
      const node = GraphUtils.getNodeByID(
        this.props.activeGraph.nodes,
        edge.target.id
      );

      ctr.afterRenderEdge(node, edge.target);
    }
  }

  onSaveStage = stage => {
    this.props.dispatch(saveActiveGraph());
  };
  onUpdateStage = stage => {
    console.log(`update stage`);
  };
  onDeleteStage = stage => {
    console.log(`delete stage`);
  };

  onClickEdge = edge => {
    this.setState({ selectedEdge: edge.id });
    this.renderEdges();
  };

  getEdgeContainerID(edge) {
    const [sourceID] = this.getEdgeCoords('source', edge.source);
    const [targetID] = this.getEdgeCoords('target', edge.target);

    return `edge-${sourceID}-${targetID}-container`;
  }

  getEdgeCoords(point, edgeTarget) {
    const node = GraphUtils.getNodeByID(
      this.props.activeGraph.nodes || [],
      edgeTarget.id
    );

    const edgeTargetID = edgeTarget.type.getEdgeTargetID(edgeTarget);
    const coords = edgeTarget.type.getConnectorPosition(
      node,
      edgeTarget,
      point
    );

    if (coords == null) {
      return [false, false];
    }

    // the edge determines the connection points
    // by calling static methods on the node class.
    // The node class decides where a edge can
    // connect and how it should behave.
    // here we pass in the type information for the source/target node
    coords.type = edgeTarget.type;

    if (!edgeTargetID || !coords) {
      console.warn(`edge target id not found`, edgeTarget);

      return [0, 0];
    }

    return [edgeTargetID, coords];
  }

  renderEdge = (id, element, edge) => {
    if (!this.entities) {
      return null;
    }

    const containerId = GraphUtils.getNodeContainerById(id);
    let edgeContainer = document.getElementById(containerId);

    if (!edgeContainer) {
      const newSvgEdgeContainer = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
      );

      newSvgEdgeContainer.id = containerId;
      this.renderLayer[LAYER_EDGE].prepend(newSvgEdgeContainer);
      edgeContainer = newSvgEdgeContainer;
    }

    // ReactDOM.render replaces the insides of an element This renders the element
    // into the edgeContainer
    if (edgeContainer) {
      ReactDOM.render(element, edgeContainer);
    }
  };

  onNodeEditChange = (oldNode, node) => {
    const graph = this.props.activeGraph;
    const i = GraphUtils.getNodeIndexById(graph.nodes, node.id);

    graph.nodes[i] = node;

    // create new reference
    graph.nodes = [...graph.nodes];

    // update edges
    graph.edges = [
      ...graph.edges.map(edge => {
        if (edge.source.id == node.id) {
          edge.source.type = node.type;
        }

        if (edge.target.id == node.id) {
          edge.target.type = node.type;
        }

        return edge;
      }),
    ];

    // if we change the node type we must ensure that
    // its container will be moved to the appropriate layer
    if (oldNode.type != node.type) {
      const containerId = GraphUtils.getNodeContainerById(node.id);
      const nodeContainer = document.getElementById(containerId);

      nodeContainer.remove();
    }

    this.props.dispatch(updateActiveGraphAction(graph));
    this.setState({
      editorNode: null,
      selectedNode: null,
    });

    this.clearModal();
    this.renderNodes();
    this.renderEdges();
  };

  onNodeEditExit = () => {
    this.setState({
      editorNode: null,
    });
    this.clearModal();
    this.renderNodes();
  };

  onChangeStage = opt => {
    const g = this.props.graphCollection.find(g => g.name == opt.value);

    if (!g) {
      console.warn(`graph not found`, opt);

      return;
    }

    this.clearStage();
    this.props.dispatch(updateActiveGraphAction(g));

    setTimeout(() => {
      this.handleZoomToFit();
    }, 50);
  };

  toggleWriteLock = () => {
    const { writeLocked } = this.state;

    this.setState({ writeLocked: !writeLocked });
  };

  clearModal = () => {
    this.setState({ modalContent: null });
  };

  onAddStage = stage => {
    this.clearStage();
    this.clearModal();
    this.props.dispatch(createGraph(stage));
  };

  toggleAddStage = () => {
    this.setState({
      modalContent: (
        <AddStage onAbort={this.clearModal} onAdd={this.onAddStage} />
      ),
    });
  };

  clearStage() {
    Object.keys(this.nodeTimeouts).forEach(k =>
      cancelAnimationFrame(this.nodeTimeouts[k])
    );
    Object.keys(this.edgeTimeouts).forEach(k =>
      cancelAnimationFrame(this.edgeTimeouts[k])
    );

    Object.keys(this.renderLayer).forEach(layer => {
      for (let i = this.renderLayer[layer].children.length - 1; i >= 0; --i) {
        this.renderLayer[layer].children[i].remove();
      }
    });
  }

  render() {
    const { graphCollection, activeGraph } = this.props;

    return (
      <div className="app">
        <div className="view-wrapper" ref={this.viewWrapper}>
          <svg className="graph">
            <defs>
              <marker
                id="mid-arrow"
                viewBox={`0 -${10 / 2} ${10} ${10}`}
                refX={`${-2}`}
                markerWidth={`${5}`}
                markerHeight={`${5}`}
                orient="auto"
              >
                <path
                  className="arrow"
                  d={`M0,-${10 / 2}L${10},0L0,${10 / 2}`}
                />
              </marker>
              <pattern
                id="grid"
                key="grid"
                width={32}
                height={32}
                patternUnits="userSpaceOnUse"
              >
                <circle fill="#999" cx={32 / 2} cy={32 / 2} r={1} />
              </pattern>
            </defs>
            <g className="view" ref={el => (this.view = el)}>
              <rect
                className="background"
                x={-this.background.width / 2}
                y={-this.background.width / 2}
                width={this.background.width}
                height={this.background.height}
                fill={`url(${'#grid'})`}
              />
              <g className="entities" ref={el => (this.entities = el)}>
                {Object.keys(this.renderLayer).map(layer => {
                  return (
                    <g
                      key={layer}
                      className={'layer-' + layer}
                      ref={el => (this.renderLayer[layer] = el)}
                    ></g>
                  );
                })}
              </g>
            </g>
          </svg>

          <Dialog enabled={this.state.modalContent}>
            {this.state.modalContent}
          </Dialog>
          <div className="fab-controls">
            <div className="fab-menu">
              <ul>
                <li>
                  <button className="fab-button accent">
                    <i className="material-icons">edit</i>
                    <BtnTooltip text="edit dashboard settings"></BtnTooltip>
                  </button>
                </li>
                <li>
                  <button className="fab-button accent">
                    <i className="material-icons">delete</i>
                    <BtnTooltip text="delete this dashboard"></BtnTooltip>
                  </button>
                </li>
                <li>
                  <button
                    className="fab-button accent"
                    onClick={this.onSaveStage}
                  >
                    <i className="material-icons">save</i>
                    <BtnTooltip text="save dashboard"></BtnTooltip>
                  </button>
                </li>
                <li>
                  <button
                    className={
                      'fab-button fab-main ' +
                      (this.state.writeLocked ? 'primary' : 'accent')
                    }
                    onClick={this.toggleWriteLock}
                  >
                    <i className="material-icons">
                      {this.state.writeLocked ? 'lock' : 'lock_open'}
                    </i>
                    <BtnTooltip
                      text={
                        this.state.writeLocked
                          ? 'unlock editing'
                          : 'lock editing'
                      }
                    ></BtnTooltip>
                  </button>
                </li>
              </ul>
            </div>
            <button className="fab-button accent" onClick={this.toggleAddStage}>
              <i className="material-icons">add</i>
            </button>
          </div>
          <div className="graph-controls">
            <div className="stage-wrapper">
              <div className="select-wrapper">
                <Select
                  className="stage-selector"
                  value={{ value: activeGraph.name, label: activeGraph.name }}
                  onChange={this.onChangeStage}
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      border: 'none',
                      padding: '0 0 0 4px',
                      borderRadius: '8px',
                      boxShadow: 'none',
                      '&:hover': {
                        border: 'none',
                      },
                    }),
                  }}
                  options={graphCollection.map(stage => {
                    return { value: stage.name, label: stage.name };
                  })}
                ></Select>
              </div>
            </div>
            <div className="actions">
              <EditStage
                onUpdate={this.onUpdateStage.bind(this)}
                onDelete={this.onDeleteStage.bind(this)}
                stage={activeGraph}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Graph;
