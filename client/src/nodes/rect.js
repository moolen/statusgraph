import * as d3 from 'd3';
import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';

class Rect extends React.Component {
  state = {};
  static width = 140;
  static height = 40;
  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
  }

  static new(x, y, name) {
    return {
      id: uuidv4(),
      type: Rect,
      name: name,
      connector: [],
      bounds: {
        x: x,
        y: y,
      },
    };
  }

  static getConnectorPosition(node, edgeTarget) {
    const width = Rect.calcWidth(node);

    return {
      x: node.bounds.x + width / 2,
      y: node.bounds.y + Rect.height / 2,
    };
  }

  static getEdgeTargetID(edgeTarget) {
    return edgeTarget.id;
  }

  componentDidMount() {
    const dragFunction = d3
      .drag()
      .on('drag', () => {
        this.handleMouseMove(d3.event);
      })
      .on('start', this.handleDragStart)
      .on('end', () => {
        this.handleDragEnd(d3.event);
      });

    d3.select(this.nodeRef.current)
      .on('mouseout', this.handleMouseOut)
      .call(dragFunction);

    // prevent zoom
    d3.select(this.nodeRef.current).on('dblclick', () => {
      this.props.onDoubleClick(this.props.node, d3.event.pageX, d3.event.pageY);
      d3.event.stopPropagation();
    });
  }

  handleDragStart() {}

  handleMouseMove(event) {
    const shiftKey = event.sourceEvent.shiftKey;

    const { node, onUpdatePosition } = this.props;
    const { pointerOffset } = this.state;

    const newState = {
      x: event.x,
      y: event.y,
      pointerOffset,
    };

    newState.pointerOffset = pointerOffset || {
      x: event.x - (node.bounds.x || 0),
      y: event.y - (node.bounds.y || 0),
    };
    newState.x -= newState.pointerOffset.x;
    newState.y -= newState.pointerOffset.y;
    this.setState(newState);

    onUpdatePosition(
      node,
      { x: newState.x, y: newState.y },
      { x: event.x, y: event.y },
      shiftKey
    );
  }
  handleDragEnd() {
    const { onDragEnd } = this.props;

    onDragEnd(this.props.node);
  }

  handleMouseOver = () => {
    this.props.onMouseOver(this.props.node);
  };
  handleMouseOut = () => {
    this.props.onMouseOut(this.props.node);
  };

  static calcWidth(node) {
    const width = 20 + node.name.length * 5;

    return Math.max(100, width);
  }

  render() {
    const { node, selected } = this.props;

    const width = Rect.calcWidth(node);

    return (
      <g
        ref={this.nodeRef}
        className="node-group"
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        transform={'translate(' + node.bounds.x + ', ' + node.bounds.y + ')'}
      >
        <rect
          className={
            'node rect' + (selected ? ' selected ' : ' ') + this.props.highlight
          }
          width={width}
          height={Rect.height}
          rx="5"
          ry="5"
        />
        <text
          className="node-text"
          x={width / 2}
          y={Rect.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {node.name}
        </text>
      </g>
    );
  }
}

Rect.SUPPORT_DYNAMIC_SOURCE_EDGE = true;
Rect.SUPPORT_DYNAMIC_TARGET_EDGE = true;

export { Rect };
