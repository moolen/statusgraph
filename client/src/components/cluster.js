import * as d3 from 'd3';
import * as React from 'react';
import { GraphUtils } from 'react-digraph';

class Cluster extends React.Component {
  static defaultProps = {};
  nodeRef;
  oldSibling;
  constructor(props) {
    super(props);
    this.state = {};
    this.nodeRef = React.createRef();
  }

  componentDidMount() {
    this.moveToBack();

    // disable dblclick to prevent zoom
    d3.select(this.nodeRef.current).on('dblclick', () => {
      d3.event.stopPropagation();
    });
  }

  moveToBack() {
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

  static getClusterBounds(clusterNode, nodeTypes) {
    const bounds = {
      min: {
        x: 99999999,
        y: 99999999,
      },
      max: {
        x: 0,
        y: 0,
      },
    };

    clusterNode.children.forEach(node => {
      const nodeElem = document.getElementById(`node-${node}-container`);

      if (!nodeElem) {
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

  handleDragEnd = event => {
    if (!this.nodeRef.current) {
      return;
    }

    const { drawingEdge } = this.state;
    const { data, nodeKey, onNodeSelected } = this.props;
    const { sourceEvent } = event;
    const shiftKey = sourceEvent.shiftKey;

    sourceEvent.stopPropagation();
    onNodeSelected(data, data[nodeKey], shiftKey || drawingEdge, sourceEvent);
  };

  onClick(e) {
    const { data, onNodeSelected, nodeKey } = this.props;

    event.stopPropagation();
    onNodeSelected(data, data[nodeKey], false, e);
  }

  stopEventPropagation(e) {
    e.stopPropagation();
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

  render() {
    const { opacity, id, data, nodeTypes } = this.props;
    const { extra_classes } = data;
    const className = GraphUtils.classNames(
      'node',
      extra_classes,
      data.type,
      {}
    );

    const clusterBounds = Cluster.getClusterBounds(data, nodeTypes);
    const clusterPadding = 10;
    const coords = {
      x: clusterBounds.min.x - clusterPadding,
      y: clusterBounds.min.y - clusterPadding * 2,
      width: clusterBounds.max.x - clusterBounds.min.x + clusterPadding * 2,
      height: clusterBounds.max.y - clusterBounds.min.y + clusterPadding * 3, // TODO: fix padding spec
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
