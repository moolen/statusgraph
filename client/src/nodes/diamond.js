import * as React from 'react';
import { Rect } from '../internal';
import { v4 as uuidv4 } from 'uuid';

export class Diamond extends Rect {
  state = {};
  static width = 100;
  static height = 100;
  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
  }

  static new(x, y, name) {
    return {
      id: uuidv4(),
      type: Diamond,
      name: name,
      connector: [],
      bounds: {
        x: x,
        y: y,
      },
    };
  }

  static getConnectorPosition(node, edgeTarget) {
    return {
      x: node.bounds.x + Diamond.width / 2,
      y: node.bounds.y + Diamond.height / 2,
    };
  }

  static getEdgeTargetID(edgeTarget) {
    return edgeTarget.id;
  }

  render() {
    const { node, selected } = this.props;

    return (
      <g
        ref={this.nodeRef}
        className="node-group"
        transform={'translate(' + node.bounds.x + ', ' + node.bounds.y + ')'}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
      >
        <g>
          <rect
            width={Diamond.width}
            height={Diamond.height}
            transform={`rotate(45, ${Diamond.width / 2}, ${Diamond.height /
              2})`}
            className={
              'node diamond' +
              (selected ? ' selected ' : ' ') +
              this.props.highlight
            }
            rx="5"
            ry="5"
          />
        </g>

        <text
          className="node-text"
          x={Diamond.width / 2}
          y={Diamond.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {node.name}
        </text>
      </g>
    );
  }
}