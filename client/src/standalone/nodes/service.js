//import * as d3 from 'd3';
import * as React from 'react';
import { GraphUtils } from 'react-digraph';
import './service.scss';
import Rect from './rect.js';

class Service extends Rect {
  static defaultProps = {};
  nodeRef;
  oldSibling;
  padding = 20;

  state = {
    dragging: false,
    hoveredPort: null,
  };
  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
    this.state = {
      x: props.node.bounds.x || 0,
      y: props.node.bounds.y || 0,
    };
  }

  static getConnectorPosition(node, edgeTarget) {
    const connector = node.connector
      .map((p, i) => [i, p.id])
      .find(p => p[1] == edgeTarget.connector);

    if (connector == undefined) {
      console.warn(`could not find connector for target`, node, edgeTarget);

      return { x: 0, y: 0 };
    }

    // port[0] is the index
    const yOff = 52 + 18 + connector[0] * 36;

    return {
      x: node.bounds.x,
      y: node.bounds.y + yOff,
    };
  }

  static getConnector(node) {
    return node.connector.find(p => {
      return document
        .getElementById(node.id + '-' + p.id + '-hoverstate')
        .classList.contains('hovered');
    });
  }

  static afterRenderEdge(node, edge) {
    const tp = node.connector.find(p => p.id == edge.connector);

    if (!tp) {
      console.warn(`could not find connector for edge`, edge);

      return;
    }

    ['path', 'circle'].forEach(g => {
      const id = node.id + '-' + tp.id + '-' + g;
      const el = document.getElementById(id);

      el.classList.remove('invisible');
    });
  }

  onPortMouseOver = port => {
    this.setState({ hoveredPort: port.id });
  };
  onPortMouseOut = port => {
    this.setState({ hoveredPort: null });
  };

  render() {
    const { opacity, node } = this.props;
    const { x, y } = node.bounds ? node.bounds : this.state;
    const { extra_classes } = node || [];
    const className = GraphUtils.classNames(
      'node',
      extra_classes,
      'service',
      {}
    );

    const coords = {
      x: x,
      y: y,
      width: 300,
      height: 211,
    };

    const ports = node.connector;

    return (
      <g
        id={node.id}
        ref={this.nodeRef}
        className={className}
        width={coords.width}
        height={coords.height}
        opacity={opacity}
        transform={`translate(${coords.x}, ${coords.y})`}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        //onClick={this.onClick.bind(this)}
        style={{
          transform: `matrix(1, 0, 0, 1, ${coords.x}, ${coords.y})`,
        }}
      >
        <foreignObject width={coords.width + 30} height={coords.height}>
          <div className="service-wrapper">
            <div className="out-connector"></div>
            <div className="service-border">
              <header className="service-header">
                <hgroup className="service-title-wrapper">
                  <h3 className="name">{node.name}</h3>
                  <h4 className="namespace">{node.namespace}</h4>
                </hgroup>
                <a href="#" className="service-settings">
                  <i className="fa fa-cog"></i>
                </a>
              </header>
              <section className="service-port-wrapper">
                {ports.map(port => {
                  return (
                    <div
                      key={port.id}
                      id={node.id + '-' + port.id + '-hoverstate'}
                      onMouseOver={this.onPortMouseOver.bind(this, port)}
                      onMouseOut={this.onPortMouseOut.bind(this, port)}
                      className={
                        'service-protocol-wrapper ' +
                        (this.state.hoveredPort == port.id ? 'hovered' : '')
                      }
                    >
                      <header className="protocol-content">
                        <div className="protocol-label">
                          <span className="protocol-port">{port.port}</span>
                          <span className="protocol-title">
                            {port.proto.toUpperCase()} ·{' '}
                            {port.name.toUpperCase()}
                          </span>
                        </div>
                      </header>
                    </div>
                  );
                })}
              </section>
              <section className="service-label-wrapper">
                <span className="service-label">
                  <span className="label-title">
                    io.cilium.k8s.policy.cluster:default
                  </span>
                </span>
                <span className="service-label">
                  <span className="label-title">
                    io.cilium.k8s.policy.serviceaccount:default
                  </span>
                </span>
              </section>
            </div>
          </div>
        </foreignObject>
        <g>
          {ports.map((port, i) => {
            return (
              <g key={port.id} id={node.id + '-' + port.id + '-group'}>
                <path
                  id={node.id + '-' + port.id + '-path'}
                  className="proto-connector-line invisible"
                  d={'M2,' + (52 + 18 + i * 36) + 'l18,0'}
                />
                <circle
                  id={node.id + '-' + port.id + '-circle'}
                  cx={2}
                  cy={52 + 18 + i * 36}
                  r="4"
                  className="proto-connector invisible"
                />
              </g>
            );
          })}
        </g>
      </g>
    );
  }
}

export default Service;
