import * as React from 'react';
import { Rect } from '../internal';
import { v4 as uuidv4 } from 'uuid';

export class Actor extends Rect {
  state = {};
  static width = 64;
  static height = 64;
  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
  }

  static new(x, y, name) {
    return {
      id: uuidv4(),
      type: Actor,
      name: name,
      connector: [],
      bounds: {
        x: x,
        y: y,
      },
    };
  }

  static getConnectorPosition(node, edgeTarget) {
    if (!node) {
      return null;
    }

    return {
      x: node.bounds.x + Actor.width / 2,
      y: node.bounds.y + Actor.height / 2,
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
        <rect
          width={Actor.width}
          height={Actor.height}
          className={
            'node actor' +
            (selected ? ' selected ' : ' ') +
            this.props.highlight
          }
          rx="5"
          ry="5"
        />
        <path
          transform={'translate(15, 5), scale(1.33)'}
          d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm7.753 18.305c-.261-.586-.789-.991-1.871-1.241-2.293-.529-4.428-.993-3.393-2.945 3.145-5.942.833-9.119-2.489-9.119-3.388 0-5.644 3.299-2.489 9.119 1.066 1.964-1.148 2.427-3.393 2.945-1.084.25-1.608.658-1.867 1.246-1.405-1.723-2.251-3.919-2.251-6.31 0-5.514 4.486-10 10-10s10 4.486 10 10c0 2.389-.845 4.583-2.247 6.305z"
        />
        <text
          className="node-text"
          x={Actor.width / 2}
          y={50}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {node.name}
        </text>
      </g>
    );
  }
}
