import * as d3 from 'd3';
import ReactDOM from 'react-dom';
import * as React from 'react';
import './graph.scss';
import DebugComponent from './lib/debug-component';
import Rect from './nodes/rect';
import Service from './nodes/service';
import Edge from './edge';
import Titlebar from '../components/titlebar';
import NodeEditor from './node-editor';
import GraphUtils from './graph-utils';
//import Tooltip from './components/tooltip';

class Graph extends DebugComponent {
  static defaultProps = {
    maxZoom: 3,
    minZoom: 0.5,
    zoomDelay: 1000,
    zoomDur: 750,
  };

  state = {
    hoveredNode: null,
    draggingEdge: null,
    writeLocked: false,
    editorNode: null,
    availableStages: [],
    graph: {
      id: '',
      name: '',
      edges: [
        {
          source: {
            type: 'node',
            id: '13124126513',
          },
          target: {
            type: 'service',
            id: '9fu138u',
            connector: '565555555',
          },
          type: Edge,
        },
      ],
      nodes: [
        {
          id: '13124126513',
          name: 'An Node',
          type: Rect,
          bounds: {
            x: 100,
            y: 100,
            width: 100,
            height: 100,
          },
        },
        {
          id: '9fu138u',
          name: 'Broccoli.ftw',
          type: Service,
          connector: [
            {
              id: '123123',
              port: '9080',
              name: 'http',
              proto: 'tcp',
            },
            {
              id: '565555555',
              port: '50051',
              name: 'grpc',
              proto: 'tcp',
            },
          ],
          bounds: {
            x: 300,
            y: 300,
            width: 100,
            height: 100,
          },
        },
      ],
    },
  };

  renderNodesTimeout = null;
  renderEdgesTimeout = null;
  nodeTimeouts = {};
  edgeTimeouts = {};

  background = {
    width: 40960,
    height: 40960,
  };

  constructor(props) {
    super(props);
    this.viewWrapper = React.createRef();
    this.graphSvg = React.createRef();
    window.gr = this;
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
  }

  handleWrapperKeydown(e) {
    console.log(`wrapper keydown`, e);

    if (e.key == 'Escape') {
      this.setState({
        editorNode: null,
        draggingEdge: null,
      });
    }
  }

  handleDocumentClick(e) {
    console.log(`document click`, e);
  }

  handleSvgClicked(event) {
    const { shiftKey } = event;
    const coords = d3.mouse(d3.event.target);

    if (shiftKey) {
      this.createNode({
        id: Date.now().toString(),
        bounds: {
          x: coords[0] - 40,
          y: coords[1] - 40,
          width: 80,
          height: 80,
        },
        type: Rect,
      });
    }
  }

  onUpdateNodePosition = (id, newNodePos, pointerPos, shift) => {
    const node = this.getNodeByID(id);
    const { draggingEdge } = this.state;

    if (!shift) {
      if (draggingEdge) {
        this.setState({ draggingEdge: false });
        this.removeDraggingEdgeContainer();
      }

      Object.assign(node.bounds, { x: newNodePos.x, y: newNodePos.y });
      this.renderNode(node);
      this.renderEdges();

      return;
    } else {
      if (!draggingEdge) {
        this.setState({
          draggingEdge: null,
        });
      }

      this.setState({
        draggingEdge: {
          type: Edge,
          source: {
            type: 'node',
            id: node.id,
          },
          target: {
            type: 'coords',
            coords: {
              x: pointerPos.x,
              y: pointerPos.y,
            },
          },
        },
      });
    }

    this.renderEdges();
  };

  onNodeMouseOver = node => {
    this.setState({ hoveredNode: node });
  };
  onNodeMouseOut = node => {
    this.setState({ hoveredNode: null });
  };

  onNodeDragEnd = node => {
    const { graph, draggingEdge, hoveredNode } = this.state;

    if (draggingEdge) {
      if (hoveredNode) {
        draggingEdge.target = {
          type: 'node',
          id: hoveredNode.id,
        };

        if (hoveredNode.type.hasOwnProperty('getConnector')) {
          const connector = hoveredNode.type.getConnector(hoveredNode);

          if (!connector) {
            console.warn(`must connect to service port`);

            return;
          }

          draggingEdge.target.type = 'service';
          draggingEdge.target.connector = connector.id;
        }

        graph.edges = [draggingEdge, ...graph.edges];
      }

      this.setState({
        draggingEdge: null,
        graph,
      });
      this.removeDraggingEdgeContainer();
      this.renderEdges();
    }
  };

  onNodeDoubleClick = (node, x, y) => {
    this.setState({
      editorNode: node,
    });
  };

  removeDraggingEdgeContainer() {
    const container = document.getElementById('edge-dragging-container');

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

    this.state.graph.nodes.forEach((node, i) => {
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

      const timeoutId = `${edge.target.type}-${edge.target.id}-${edge.source.type}-${edge.source.id}`;

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

    const element = (
      <node.type
        node={node}
        onUpdatePosition={this.onUpdateNodePosition}
        onMouseOver={this.onNodeMouseOver}
        onMouseOut={this.onNodeMouseOut}
        onDoubleClick={this.onNodeDoubleClick}
        onDragEnd={this.onNodeDragEnd}
      />
    );

    const containerId = `${node.id}-container`;
    let nodeContainer = document.getElementById(containerId);

    if (!nodeContainer) {
      nodeContainer = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
      );
      nodeContainer.id = containerId;
      this.entities.appendChild(nodeContainer);
    }

    ReactDOM.render(element, nodeContainer);
  }

  getNodeByID(id) {
    return this.state.graph.nodes.find(node => node.id == id);
  }

  getNodeIndex(searchNode) {
    return this.state.graph.nodes.findIndex(node => {
      return node.id === searchNode.id;
    });
  }

  syncRenderEdge(edge) {
    // eslint-disable-next-line
    const [sourceID, from] = this.getEdgeCoords(edge.source);
    const [targetID, to] = this.getEdgeCoords(edge.target);

    let id = `edge-${sourceID}-${targetID}`;

    if (edge.target.type == 'coords') {
      id = 'edge-dragging';
    }

    if (!edge.type) {
      console.warn(`trying to render edge without type`, edge);
    }

    const element = <edge.type edge={edge} from={from} to={to} />;

    this.renderEdge(id, element, edge);

    // this allows to change the Node after edge is drawn
    const ctr = GraphUtils.getNodeClassForEdgeTarget(edge.target);

    if (ctr && ctr.hasOwnProperty('afterRenderEdge')) {
      const node = this.getNodeByID(edge.target.id);

      ctr.afterRenderEdge(node, edge.target);
    }
  }

  getEdgeCoords(edgeTarget) {
    let node, coords;

    switch (edgeTarget.type) {
      case 'node':
        node = this.getNodeByID(edgeTarget.id);

        if (!node) {
          console.warn(`node for id ${edgeTarget.id} not found`);

          return;
        }

        return [
          edgeTarget.id,
          {
            x: node.bounds.x + node.bounds.width / 2,
            y: node.bounds.y + node.bounds.height / 2,
          },
        ];
      case 'coords':
        return ['dragging', edgeTarget.coords];

      case 'service':
        node = this.getNodeByID(edgeTarget.id);
        coords = Service.getConnectorPosition(node, edgeTarget);

        return [`${edgeTarget.connector}-${edgeTarget.id}`, coords];
      default:
        console.warn(`invalid edge target type`, edgeTarget);
    }
  }

  renderEdge = (id, element, edge) => {
    if (!this.entities) {
      return null;
    }

    const containerId = `${id}-container`;
    let edgeContainer = document.getElementById(containerId);

    if (!edgeContainer) {
      const newSvgEdgeContainer = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
      );

      newSvgEdgeContainer.id = containerId;
      this.entities.prepend(newSvgEdgeContainer);
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
    const i = this.getNodeIndex(node);

    graph.nodes[i] = node;

    // create new reference
    graph.nodes = [...this.state.graph.nodes];

    this.setState({
      graph: graph,
      editorNode: null,
    });
    this.renderNodes();
  };

  onNodeEditExit = () => {
    this.setState({
      editorNode: null,
    });
    this.renderNodes();
  };

  render() {
    return (
      <div className="app">
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
          onNodeEditChange={this.onNodeEditChange}
          onNodeEditExit={this.onNodeEditExit}
          enabled={!!this.state.editorNode}
          node={this.state.editorNode}
          nodes={this.state.graph.nodes}
        />
        <div className="view-wrapper" ref={this.viewWrapper}>
          <svg className="graph" ref={this.graphSvg}>
            <defs>
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
              <g className="entities" ref={el => (this.entities = el)}></g>
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

module.exports = Graph;
