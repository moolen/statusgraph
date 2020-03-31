import * as d3 from 'd3';
import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GraphUtils } from '../internal';

export class Cluster extends React.Component {
  nodeRef;
  padding = 16;

  state = {
    bounds: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
    dragging: false,
  };

  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
  }

  static new(name, children) {
    return {
      id: uuidv4(),
      type: Cluster,
      name: name,
      connector: [],
      children: children,
      bounds: {
        x: null,
        y: null,
      },
    };
  }

  static onUpdateNodeHook(graph, node, pos) {
    node.children.forEach(c => {
      const i = GraphUtils.getNodeIndexById(graph.nodes, c);
      const n = graph.nodes[i];

      n.bounds.x += pos.dx;
      n.bounds.y += pos.dy;
      graph.nodes[i] = n;
    });

    graph.nodes = [...graph.nodes];

    return graph;
  }

  static isClusterContainer(container) {
    if (
      container.children.length > 0 &&
      container.children[0].children.length > 0
    ) {
      return container.children[0].children[0].classList.contains(
        'cluster-shape'
      );
    }

    return false;
  }

  static getEdgeTargetID(edgeTarget) {
    return edgeTarget.id;
  }

  static getConnectorPosition(node, edgeTarget) {
    const bounds = Cluster.getClusterBounds(node);

    return {
      x: bounds.min.x + (bounds.max.x - bounds.min.x) / 2,
      y: bounds.min.y,
    };
  }

  componentDidMount() {
    this.toBackground();
    // disable dblclick to prevent zoom
    d3.select(this.nodeRef.current).on('dblclick', () => {
      this.props.onDoubleClick(this.props.node, d3.event.pageX, d3.event.pageY);
      d3.event.stopPropagation();
    });

    // attach drag handler
    const dragFunction = d3
      .drag()
      .on('drag', () => {
        this.handleMouseMove(d3.event);
      })
      .on('start', this.handleDragStart)
      .on('end', () => {
        this.handleDragEnd(d3.event);
      });

    d3.select(this.nodeRef.current).call(dragFunction);
  }

  toBackground() {
    if (!this.nodeRef.current) {
      return;
    }

    if (!this.oldSibling) {
      this.oldSibling = this.nodeRef.current.parentElement.nextSibling;
    }

    this.nodeRef.current.parentElement.parentElement.prepend(
      this.nodeRef.current.parentElement
    );
  }

  handleMouseMove = event => {
    const { onUpdatePosition } = this.props;
    const { bounds } = this.state;
    const { pointerOffset } = this.state;

    if (this.props.writeLocked) {
      return;
    }

    const gb = GraphUtils.getGridPosition(event);

    const newState = {
      bounds: {
        x: gb.x,
        y: gb.y,
        width: bounds.width,
        height: bounds.height,
      },
      pointerOffset,
    };

    newState.pointerOffset = pointerOffset || {
      x: gb.x - (bounds.x || 0),
      y: gb.y - (bounds.y || 0),
    };
    newState.bounds.x -= newState.pointerOffset.x;
    newState.bounds.y -= newState.pointerOffset.y;

    this.setState(newState);

    onUpdatePosition(
      this.props.node,
      {
        x: newState.bounds.x,
        y: newState.bounds.y,
        dx: newState.bounds.x - bounds.x,
        dy: newState.bounds.y - bounds.y,
      },
      null,
      false
    );
  };

  handleDragStart = () => {
    if (this.props.writeLocked) {
      return;
    }

    this.setState({ dragging: true });
  };

  static getClusterBounds(clusterNode) {
    const bounds = {
      min: {
        x: 99999999,
        y: 99999999,
      },
      max: {
        x: -9999999,
        y: -9999999,
      },
    };

    clusterNode.children.forEach(nodeId => {
      const containerId = GraphUtils.getNodeContainerById(nodeId);
      const nodeElem = document.getElementById(containerId);

      if (!nodeElem) {
        console.warn(
          `calc cluster bounds: cannot find node with id: ${nodeId}`
        );

        return;
      }

      // cluster elements should get some extra padding
      const bb = nodeElem.getBBox();
      const maxX = bb.x + bb.width;
      const maxY = bb.y + bb.height;
      let pad = 0;

      if (Cluster.isClusterContainer(nodeElem)) {
        pad = 5;
      }

      if (bb.x < bounds.min.x) {
        bounds.min.x = bb.x - pad;
      }

      if (bb.y < bounds.min.y) {
        bounds.min.y = bb.y - pad;
      }

      if (maxX > bounds.max.x) {
        bounds.max.x = maxX + pad;
      }

      if (maxY > bounds.max.y) {
        bounds.max.y = maxY + pad;
      }
    });

    return bounds;
  }

  handleDragEnd = e => {
    if (!this.nodeRef.current) {
      return;
    }

    let { bounds } = this.state;
    const { node, onUpdatePosition } = this.props;

    bounds = GraphUtils.getGridPosition(bounds);

    this.setState({
      initialBounds: bounds,
      pointerOffset: null,
      dragging: false,
    });

    onUpdatePosition(
      node,
      {
        x: bounds.x,
        y: bounds.y,
        dx: 0,
        dy: 0,
      },
      null,
      false
    );
  };

  handleMouseOver = () => {
    this.props.onMouseOver(this.props.node);
  };
  handleMouseOut = () => {
    this.props.onMouseOut(this.props.node);
  };

  renderText(coords) {
    const { name } = this.props.node;
    const lineOffset = 14;

    return (
      <g
        className="cluster-title"
        width={coords.width}
        height={coords.height}
        transform={`translate(${coords.width / 2}, ${0})`}
        style={{
          transform: `matrix(1, 0, 0, 1, ${coords.width / 2}, ${0})`,
        }}
      >
        <text textAnchor="middle">
          {name && (
            <tspan x={0} dy={lineOffset} fontSize="10px">
              {name}
            </tspan>
          )}
          {name && <title>{name}</title>}
        </text>
      </g>
    );
  }

  static getDerivedStateFromProps(props, state) {
    if (state.dragging) {
      return null;
    }

    const { node } = props;

    if (!node.children || node.children.length == null) {
      console.warn(`cluster can not have 0 children`, node);

      return;
    }

    const clusterBounds = Cluster.getClusterBounds(node);
    const bounds = {
      x: clusterBounds.min.x,
      y: clusterBounds.min.y,
      width: clusterBounds.max.x - clusterBounds.min.x,
      height: clusterBounds.max.y - clusterBounds.min.y,
    };

    return {
      initialBounds: bounds,
      bounds: bounds,
    };
  }

  render() {
    const { opacity, id } = this.props;
    const { bounds } = this.state;

    const coords = {
      x: bounds.x - this.padding,
      y: bounds.y - this.padding * 2,
      width: bounds.width + 2 * this.padding,
      height: bounds.height + 3 * this.padding,
    };

    return (
      <g
        id={id}
        ref={this.nodeRef}
        className={'node-group'}
        width={coords.width}
        height={coords.height}
        opacity={opacity}
        transform={`translate(${coords.x}, ${coords.y})`}
        style={{
          transform: `matrix(1, 0, 0, 1, ${coords.x}, ${coords.y})`,
        }}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
      >
        <g className="cluster-shape">
          <rect
            className={
              'node cluster ' + (this.props.selected ? 'selected' : '')
            }
            width={coords.width}
            height={coords.height}
          />
        </g>
        {this.renderText(coords)}
      </g>
    );
  }
}
