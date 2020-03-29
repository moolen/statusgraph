import * as React from 'react';
import * as d3 from 'd3';

export class Sparkline extends React.Component {
  static defaultProps = {
    width: 100,
    height: 16,
  };

  nodeRef = React.createRef();
  canvas = null;

  componentDidMount() {
    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
      width = this.props.width - margin.left - margin.right,
      height = this.props.height - margin.top - margin.bottom;

    this.canvas = d3
      .select(this.nodeRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let data = this.props.data;

    data = data.map(d => {
      return { date: d3.isoParse(d.date), value: d.value };
    });

    const x = d3
      .scaleTime()
      .domain(
        d3.extent(data, function(d) {
          return d.date;
        })
      )
      .range([0, width]);

    // add Y axis
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, d => -d.value),
        d3.max(data, d => {
          return +d.value;
        }),
      ])
      .range([height, 0]);

    // add line
    this.canvas
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr(
        'd',
        d3
          .line()
          .x(function(d) {
            return x(d.date);
          })
          .y(function(d) {
            return y(d.value);
          })
      );
  }

  componentDidUpdate() {}

  render() {
    return <div className="sparkline" ref={this.nodeRef}></div>;
  }
}
