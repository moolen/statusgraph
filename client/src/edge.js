import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';

export class Edge extends React.Component {
  static new(source, target) {
    return {
      id: uuidv4(),
      source: source,
      target: target,
      type: Edge,
    };
  }

  static lineFunction(points) {
    return d3
      .line()
      .curve(d3.curveBasis)
      .x(d => {
        return d.x;
      })
      .y(d => {
        return d.y;
      })(points);
  }

  calculatePathData(from, to) {
    let yOff = 0;
    let xOff = 70;
    const yDiff = to.y - from.y;
    const xDiff = to.x - from.x;
    const a = yDiff / xDiff;

    if (to.x < from.x) {
      xOff = -70;
    }

    if (a < -0.5 || a > 0.5) {
      xOff = 0;
      yOff = yDiff > 0 ? 30 : -30;
    }

    const data = [];

    data.push({ x: from.x, y: from.y });

    if (from.offset) {
      data.push({
        x: from.x + from.offset.x,
        y: from.y + from.offset.y,
      });
    } else if (from.type.hasOwnProperty('SUPPORT_DYNAMIC_SOURCE_EDGE')) {
      data.push({
        x: from.x + xOff,
        y: from.y + yOff,
      });
    }

    if (to.offset) {
      data.push({
        x: to.x + to.offset.x,
        y: to.y + to.offset.y,
      });
    } else if (to.type.hasOwnProperty('SUPPORT_DYNAMIC_TARGET_EDGE')) {
      data.push({
        x: to.x - xOff,
        y: to.y - yOff,
      });
    }

    data.push({
      x: to.x,
      y: to.y,
    });

    return data;
  }

  onClick = e => {
    e.stopPropagation();
    this.props.onClick(this.props.edge);
  };

  render() {
    const { from, to, selected, highlight } = this.props;
    const pathData = this.calculatePathData(from, to);
    const path = Edge.lineFunction(pathData);

    return (
      <g>
        <path
          className={`edge-path ${highlight} ` + (selected ? 'selected' : '')}
          d={path}
          markerMid="url(#mid-arrow)"
        />
        <path
          stroke="transparent"
          strokeWidth="15"
          className="edge-clickable"
          onClick={this.onClick}
          d={path}
        />
      </g>
    );
  }
}
