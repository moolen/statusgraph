import * as d3 from 'd3';
import * as React from 'react';

class Rect extends React.Component {
  state = {};
  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
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

  handleDragStart() {
    console.log(`drag start`);
  }

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
      node.id,
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
    // TODO: throttle
    this.props.onMouseOver(this.props.node);
  };
  handleMouseOut = () => {
    // TODO: throttle
    this.props.onMouseOut(this.props.node);
  };

  render() {
    const { node } = this.props;

    return (
      <g
        ref={this.nodeRef}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
      >
        <rect
          width={node.bounds.width}
          height={node.bounds.height}
          rx="5"
          ry="5"
          stroke="#ccc"
          strokeWidth=".5"
          x={node.bounds.x}
          y={node.bounds.y}
          fill="white"
        />
        <text
          x={node.bounds.x + node.bounds.width / 2}
          y={node.bounds.y + node.bounds.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {node.name}
        </text>
      </g>
    );
  }
}

export default Rect;
