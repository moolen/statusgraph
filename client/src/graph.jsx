import * as d3 from 'd3';
import ReactDOM from 'react-dom';
import * as React from 'react';
import './graph.scss';
import DebugComponent from './lib/debug-component';
import {
  Rect,
  Cluster,
  Pointer,
  Edge,
  Titlebar,
  NodeEditor,
  Tooltip,
  GraphUtils,
} from './internal';

import { RenderLayerMap, LAYER_EDGE } from './config';

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
    writeLocked: true,
    editorNode: null,
    graph: {
      id: '',
      name: '',
      edges: [],
      nodes: [],
    },
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
          />
        </div>,
        this.tooltipContainer
      );
    }

    if (
      this.props.alerts != prevProps.alerts ||
      this.props.metrics != prevProps.metrics
    ) {
      this.renderNodes();
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

    this.setState({ selectedNode: hoveredNode ? hoveredNode.id : null });

    if (this.state.writeLocked) {
      return;
    }

    if (shiftKey) {
      const x = GraphUtils.gridify(coords[0]);
      const y = GraphUtils.gridify(coords[1]);

      this.createNode(Rect.new(x, y, 'new node'));
    }

    this.setState({
      selectedEdge: null,
    });

    this.renderEdges();
    this.renderNodes();
  }

  onUpdateNodePosition = (nodeData, newNodePos, pointerPos, shift) => {
    const node = GraphUtils.getNodeByID(this.state.graph.nodes, nodeData.id);
    const { draggingEdge, writeLocked } = this.state;

    if (writeLocked) {
      return;
    }

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
          this.state.graph,
          nodeData,
          newNodePos
        );

        this.setState({
          graph: g,
        });
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
    });
  };
  onNodeMouseOut = node => {
    cancelAnimationFrame(this.hoverNodeTimeout);
    this.hoverNodeTimeout = requestAnimationFrame(() => {
      this.setState({ hoveredNode: null });
    });
  };

  onNodeDragEnd = node => {
    const { graph, draggingEdge, hoveredNode } = this.state;

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
          graph.edges = [draggingEdge, ...graph.edges];
        }
      }

      this.setState({
        draggingEdge: null,
        graph,
      });
      this.removeDraggingEdgeContainer(oldDragging);
      this.renderEdges();
    }

    node.bounds = GraphUtils.getGridPosition(node.bounds);
    this.renderEdges();
    this.renderNodes();
  };

  edgeExists(e) {
    const { graph } = this.state;

    return (
      graph.edges.find(edge => {
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
    this.setState({
      editorNode: node,
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
    const { graph } = this.state;

    graph.nodes = [node, ...graph.nodes];
    this.setState({ graph });
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
    const entities = d3.select(this.entities).node();

    if (!entities) {
      return;
    }

    let viewBBox = entities.getBBox();

    if (entities.children.length == 0) {
      viewBBox = {
        x: this.background.width / 2,
        y: this.background.height / 2,
        width: window.innerWidth,
        height: window.innerHeight,
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
    if (!this.entities) {
      return;
    }

    // we must render the cluster nodes AFTER all other
    this.state.graph.nodes
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
    const { edges } = this.state.graph;
    const { draggingEdge } = this.state;

    if (!this.entities) {
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
    const { alerts, metrics, mapping } = this.props;

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

    if (!metrics.available_services) {
      return '';
    }

    // ["foo,bar", "baz"] => does it include "foo"?
    return metrics.available_services
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

    const { graph } = this.state;

    // remove node from dom
    const containerId = GraphUtils.getNodeContainerById(id);
    const nodeContainer = document.getElementById(containerId);

    if (!nodeContainer) {
      console.warn(`trying to remove node with missing container`);

      return;
    }

    // remove edges
    graph.edges
      .filter(edge => edge.source.id == id || edge.target.id == id)
      .forEach(edge => this.removeEdgeByID(edge.id));

    nodeContainer.remove();

    graph.nodes = graph.nodes.map(node => {
      if (node.children && node.children.includes(id)) {
        node.children = node.children.filter(cid => cid != id);
      }

      return node;
    });

    // update state
    graph.nodes = [...graph.nodes.filter(node => node.id != id)];
    this.setState({ graph });
  }

  removeEdgeByID(id) {
    if (!id) {
      return;
    }

    const edge = GraphUtils.getEdgeByID(this.state.graph.edges, id);
    const eci = this.getEdgeContainerID(edge);
    const container = document.getElementById(eci);

    if (!container) {
      console.warn(`trying to remove edge with missing container`);

      return;
    }

    container.remove();
    const { graph } = this.state;

    graph.edges = [...graph.edges.filter(edge => edge.id != id)];
    this.setState({ graph });
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

    const element = (
      <edge.type
        edge={edge}
        from={from}
        to={to}
        onClick={this.onClickEdge}
        selected={this.state.selectedEdge == edge.id ? true : false}
      />
    );

    this.renderEdge(id, element, edge);

    // this allows to change the Node after edge is drawn
    const ctr = edge.target.type;

    if (ctr && ctr.hasOwnProperty('afterRenderEdge')) {
      const node = GraphUtils.getNodeByID(
        this.state.graph.nodes,
        edge.target.id
      );

      ctr.afterRenderEdge(node, edge.target);
    }
  }

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
    const node = GraphUtils.getNodeByID(this.state.graph.nodes, edgeTarget.id);
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
    const graph = this.state.graph;
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

    this.setState({
      graph: graph,
      editorNode: null,
      selectedNode: null,
    });

    this.renderNodes();
    this.renderEdges();
  };

  onNodeEditExit = () => {
    this.setState({
      editorNode: null,
    });
    this.renderNodes();
  };

  onChangeStage = (name, graph) => {
    this.setState(
      {
        graph: graph,
      },
      () => {
        this.clearStage();
        this.renderNodes();
        this.renderEdges();
        setTimeout(() => {
          this.handleZoomToFit();
        }, 50);
      }
    );
  };

  onChangeWriteLock = wl => {
    this.setState({ writeLocked: wl });
  };

  clearStage() {
    Object.keys(this.nodeTimeouts).forEach(k =>
      cancelAnimationFrame(this.nodeTimeouts[k])
    );
    Object.keys(this.edgeTimeouts).forEach(k =>
      cancelAnimationFrame(this.nodeTimeouts[k])
    );
    Object.keys(this.renderLayer).forEach(layer => {
      for (let i = this.renderLayer[layer].children.length - 1; i >= 0; --i) {
        this.renderLayer[layer].children[i].remove();
      }
    });
  }

  render() {
    return (
      <div className="app">
        <Titlebar
          writeLocked={this.state.writeLocked}
          onChange={this.onChangeStage}
          onChangeWriteLock={this.onChangeWriteLock}
          graph={this.state.graph}
        />
        <NodeEditor
          onNodeEditChange={this.onNodeEditChange}
          onNodeEditExit={this.onNodeEditExit}
          enabled={!!this.state.editorNode}
          node={this.state.editorNode}
          nodes={this.state.graph.nodes}
        />
        <div className="view-wrapper" ref={this.viewWrapper}>
          <svg className="graph">
            <defs>
              <marker
                id="end-arrow"
                viewBox={`0 -${10 / 2} ${10} ${10}`}
                refX={`${10 / 2}`}
                markerWidth={`${10}`}
                markerHeight={`${10}`}
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
        </div>
      </div>
    );
  }
}

module.exports = Graph;
