// @flow
import * as React from 'react';
import './service.scss';
import { Rect } from '../internal';
import { v4 as uuidv4 } from 'uuid';

class Service extends Rect {
  static defaultProps = {};
  nodeRef;
  oldSibling;
  padding = 20;

  state = {
    dragging: false,
    hoveredConnector: null,
  };

  static width = 300;
  static height = 211;

  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
    this.state = {
      x: props.node.bounds.x || 0,
      y: props.node.bounds.y || 0,
    };
  }

  static new(x, y, name) {
    return {
      id: uuidv4(),
      type: Service,
      name: name,
      labels: [
        'app.kubernetes.io/name=myapp',
        'app.kubernetes.io/instance=canary',
        'app.kubernetes.io/managed-by=helm',
        'app.kubernetes.io/component=application',
      ],
      connector: [
        {
          id: uuidv4(),
          label: '/api/v1/cats',
          name: 'HTTP · DEPRECATED',
        },
        {
          id: uuidv4(),
          label: '/api/v2/awww',
          name: 'grpc',
        },
        {
          id: uuidv4(),
          label: '/api/v2/puppies',
          name: 'grpc',
        },
        {
          id: uuidv4(),
          label: '/api/v2/doggos',
          name: 'grpc',
        },
        {
          id: uuidv4(),
          label: '/api/v2/bread',
          name: 'grpc',
        },
      ],
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

    if (point == 'source') {
      return {
        x: node.bounds.x + Service.width + 27,
        y: node.bounds.y + 24,
        offset: {
          x: 70,
          y: 0,
        },
      };
    }

    const connector = node.connector
      .map((p, i) => [i, p.id])
      .find(p => p[1] == edgeTarget.connector);

    if (connector == undefined) {
      console.warn(`could not find connector for target`, node, edgeTarget);

      return { x: 0, y: 0 };
    }

    // conn[0] is the index
    const yOff = Service.getConnectorOffset(connector[0]);

    return {
      x: node.bounds.x,
      y: node.bounds.y + yOff,
      offset: {
        x: -70,
        y: 0,
      },
    };
  }

  static getConnectorOffset(i) {
    return 2 + 53 + 16 + i * 33;
  }

  static getEdgeTargetID(edgeTarget) {
    return `${edgeTarget.connector}-${edgeTarget.id}`;
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

      if (el) {
        el.classList.remove('invisible');
      }
    });
  }

  onConnectorMouseOver = c => {
    this.setState({ hoveredConnector: c.id });
  };
  onConnectorMouseOut = c => {
    this.setState({ hoveredConnector: null });
  };

  render() {
    const { opacity, node } = this.props;
    const { x, y } = node.bounds ? node.bounds : this.state;

    const coords = {
      x: x,
      y: y,
    };

    const conn = node.connector || [];
    const labels = node.labels || [];
    const height = 2 + 53 + conn.length * 33 + 11 + labels.length * 13 + 2;

    return (
      <g
        id={node.id}
        ref={this.nodeRef}
        className="node-group"
        width={Service.width}
        height={height}
        opacity={opacity}
        transform={`translate(${coords.x}, ${coords.y})`}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        style={{
          transform: `matrix(1, 0, 0, 1, ${coords.x}, ${coords.y})`,
        }}
      >
        <foreignObject
          className={'node service ' + this.props.highlight}
          width={Service.width + 30}
          height={height}
        >
          <div className="service-wrapper">
            <div className="out-connector"></div>
            <div className="service-border">
              <header className="service-header">
                <hgroup className="service-title-wrapper">
                  <h3 className="name">{node.name}</h3>
                  <h4 className="namespace">{node.namespace}</h4>
                </hgroup>
                {/* <a href="#" className="service-settings">
                  <i className="fa fa-cog"></i>
                </a> */}
                <a
                  href="#"
                  className={'service-status ' + this.props.highlight}
                ></a>
              </header>
              <section className="service-port-wrapper">
                {conn.map(c => {
                  return (
                    <div
                      key={c.id}
                      id={node.id + '-' + c.id + '-hoverstate'}
                      onMouseOver={this.onConnectorMouseOver.bind(this, c)}
                      onMouseOut={this.onConnectorMouseOut.bind(this, c)}
                      className={
                        'service-protocol-wrapper ' +
                        (this.state.hoveredConnector == c.id ? 'hovered' : '')
                      }
                    >
                      <header className="protocol-content">
                        <div className="protocol-label">
                          <span className="protocol-lbl">{c.label}</span>
                          <span className="protocol-title">
                            {c.name.toUpperCase()}
                          </span>
                        </div>
                      </header>
                    </div>
                  );
                })}
              </section>
              {labels.length > 0 && (
                <section className="service-label-wrapper">
                  {labels.map((label, i) => {
                    return (
                      <span key={label + i} className="service-label">
                        <span className="label-title">{label}</span>
                      </span>
                    );
                  })}
                </section>
              )}
            </div>
          </div>
        </foreignObject>
        <g>
          {conn.map((c, i) => {
            const yOff = Service.getConnectorOffset(i);

            return (
              <g key={c.id} id={node.id + '-' + c.id + '-group'}>
                <path
                  id={node.id + '-' + c.id + '-path'}
                  className="proto-connector-line invisible"
                  d={'M2,' + yOff + 'l18,0'}
                />
                <circle
                  id={node.id + '-' + c.id + '-circle'}
                  cx={2}
                  cy={yOff}
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

Service.SUPPORT_DYNAMIC_SOURCE_EDGE = true;
Service.SUPPORT_DYNAMIC_TARGET_EDGE = true;

export { Service };
