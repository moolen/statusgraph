import * as d3 from 'd3';
import * as React from 'react';
import { GraphUtils } from 'react-digraph';

class Cluster extends React.Component {
  static defaultProps = {};
  nodeRef;
  oldSibling;
  padding = 20;

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

  componentDidMount() {
    this.toBackground();

    // disable dblclick to prevent zoom
    d3.select(this.nodeRef.current).on('dblclick', () => {
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

  handleMouseMove = event => {
    const { bounds } = this.state;
    const { pointerOffset } = this.state;
    const newState = {
      bounds: {
        x: event.x,
        y: event.y,
        width: bounds.width,
        height: bounds.height,
      },
      pointerOffset,
    };

    newState.pointerOffset = pointerOffset || {
      x: event.x - (bounds.x || 0),
      y: event.y - (bounds.y || 0),
    };
    newState.bounds.x -= newState.pointerOffset.x;
    newState.bounds.y -= newState.pointerOffset.y;

    this.setState(newState);
  };

  handleDragStart = () => {
    this.setState({ dragging: true });
  };

  static getClusterBounds(clusterNode, nodeTypes) {
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

    clusterNode.children.forEach(node => {
      const nodeElem = document.getElementById(`node-${node}-container`);

      if (!nodeElem) {
        console.warn(`calc cluster bounds: cannot find node with id: ${node}`);

        return;
      }

      const bb = nodeElem.getBBox();
      const maxX = bb.x + bb.width;
      const maxY = bb.y + bb.height;

      if (bb.x < bounds.min.x) {
        bounds.min.x = bb.x;
      }

      if (bb.y < bounds.min.y) {
        bounds.min.y = bb.y;
      }

      if (maxX > bounds.max.x) {
        bounds.max.x = maxX;
      }

      if (maxY > bounds.max.y) {
        bounds.max.y = maxY;
      }
    });

    return bounds;
  }

  handleDragEnd = e => {
    if (!this.nodeRef.current) {
      return;
    }

    const { bounds, initialBounds } = this.state;
    const { data, nodeKey, onNodeUpdate } = this.props;

    this.setState({
      initialBounds: bounds,
      pointerOffset: null,
      dragging: false,
    });

    onNodeUpdate(
      {
        x: bounds.x,
        y: bounds.y,
        dx: bounds.x - initialBounds.x,
        dy: bounds.y - initialBounds.y,
      },
      data[nodeKey],
      false
    );
  };

  onClick(e) {
    const { data, onNodeSelected, nodeKey } = this.props;

    onNodeSelected(data, data[nodeKey], false, e);
  }

  renderText(coords) {
    const { title } = this.props.data;
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
          {title && (
            <tspan x={0} dy={lineOffset} fontSize="10px">
              {title}
            </tspan>
          )}
          {title && <title>{title}</title>}
        </text>
      </g>
    );
  }

  static getDerivedStateFromProps(props, state) {
    if (state.dragging) {
      return null;
    }

    const { data, nodeTypes } = props;
    const clusterBounds = Cluster.getClusterBounds(data, nodeTypes);
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
    const { opacity, id, data } = this.props;
    const { extra_classes } = data;
    const { bounds } = this.state;
    const className = GraphUtils.classNames(
      'node',
      extra_classes,
      data.type,
      {}
    );

    const coords = {
      x: bounds.x - this.padding,
      y: bounds.y - this.padding,
      width: bounds.width + 2 * this.padding,
      height: bounds.height + 2 * this.padding,
    };

    return (
      <g
        id={id}
        ref={this.nodeRef}
        className={className}
        width={coords.width}
        height={coords.height}
        opacity={opacity}
        transform={`translate(${coords.x}, ${coords.y})`}
        onClick={this.onClick.bind(this)}
        style={{
          transform: `matrix(1, 0, 0, 1, ${coords.x}, ${coords.y})`,
        }}
      >
        <g className="cluster-shape">
          <rect
            className={'cluster'}
            width={coords.width}
            height={coords.height}
          />
        </g>
        {this.renderText(coords)}
      </g>
    );
  }
}

export default Cluster;
