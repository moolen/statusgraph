import React from 'react';

class Edge extends React.Component {
  render() {
    const { from, to } = this.props;

    const start = `${from.x},${from.y}`;
    const end = `${to.x},${to.y}`;

    return (
      <g>
        <path className="edge-path" d={'M ' + start + ' L ' + end} />
        <rect width="10" heigh="10" fill="blue" />
      </g>
    );
  }
}

export default Edge;
