import * as React from 'react';
import { Rect } from '../internal';
import { v4 as uuidv4 } from 'uuid';

class Poly extends Rect {
  state = {};
  static width = 96;
  static height = 75;
  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
  }

  static new(x, y, name) {
    return {
      id: uuidv4(),
      type: Poly,
      name: name,
      connector: [],
      bounds: {
        x: x,
        y: y,
      },
    };
  }

  static getConnectorPosition(node, edgeTarget, point) {
    if (!node) {
      return null;
    }

    return {
      x: node.bounds.x + Poly.width / 2,
      y: node.bounds.y + Poly.height / 2,
    };
  }

  static getEdgeTargetID(edgeTarget) {
    return edgeTarget.id;
  }

  render() {
    const { node, selected } = this.props;

    return (
      <g
        className="node-group"
        ref={this.nodeRef}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        transform={'translate(' + node.bounds.x + ',' + node.bounds.y + ')'}
      >
        <path
          className={
            'node poly' + (selected ? ' selected ' : ' ') + this.props.highlight
          }
          stroke="#ccc"
          strokeWidth=".5"
          fill={selected ? '#7379fc' : 'white'}
          d="M0,36l20,-36l52,0l20,36l-20,36l-52,0z"
        ></path>
        <foreignObject width={Poly.width - 4} height={Poly.height}>
          <div className={'node-text poly ' + this.props.highlight}>
            <span>{node.name}</span>
          </div>
        </foreignObject>
      </g>
    );
  }
}
Poly.SUPPORT_DYNAMIC_SOURCE_EDGE = true;
Poly.SUPPORT_DYNAMIC_TARGET_EDGE = true;

export { Poly };
