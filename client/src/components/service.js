import * as d3 from 'd3';
import * as React from 'react';
import { GraphUtils, Edge } from 'react-digraph';
import './service.scss';

class Service extends React.Component {
  static defaultProps = {};
  nodeRef;
  oldSibling;
  padding = 20;

  state = {
    dragging: false,
  };
  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
    this.state = {
      x: props.data.x || 0,
      y: props.data.y || 0,
    };
  }

  toBackground() {
    if (!this.nodeRef.current) {
      return;
    }

    if (!this.oldSibling) {
      this.oldSibling = this.nodeRef.current.parentElement.nextSibling;
    }

    this.nodeRef.current.parentElement.parentElement.prepend(
      this.nodeRef.current.parentElement
    );
  }

  componentDidMount() {
    this.toBackground();

    // disable dblclick to prevent zoom
    d3.select(this.nodeRef.current).on('dblclick', () => {
      d3.event.stopPropagation();
    });

    // attach drag handler
    const dragFunction = d3
      .drag()
      .on('drag', () => {
        this.handleMouseMove(d3.event);
      })
      .on('start', this.handleDragStart)
      .on('end', () => {
        this.handleDragEnd(d3.event);
      });

    d3.select(this.nodeRef.current).call(dragFunction);
  }

  handleMouseMove = event => {
    const mouseButtonDown = event.sourceEvent.buttons === 1;
    const shiftKey = event.sourceEvent.shiftKey;
    const {
      nodeSize,
      layoutEngine,
      nodeKey,
      viewWrapperElem,
      data,
    } = this.props;
    const { pointerOffset } = this.state;

    if (!mouseButtonDown) {
      return;
    }

    // While the mouse is down, this function handles all mouse movement
    const newState = {
      x: event.x,
      y: event.y,
      pointerOffset,
    };

    newState.pointerOffset = pointerOffset || {
      x: event.x - (data.x || 0),
      y: event.y - (data.y || 0),
    };
    newState.x -= newState.pointerOffset.x;
    newState.y -= newState.pointerOffset.y;

    if (shiftKey) {
      this.setState({ drawingEdge: true });
      // draw edge
      // undo the target offset subtraction done by Edge
      const off = Edge.calculateOffset(
        nodeSize,
        this.props.data,
        newState,
        nodeKey,
        true,
        viewWrapperElem
      );

      newState.x += off.xOff;
      newState.y += off.yOff;
      // now tell the graph that we're actually drawing an edge
    } else if (!this.state.drawingEdge && layoutEngine) {
      // move node using the layout engine
      Object.assign(newState, layoutEngine.getPositionForNode(newState));
    }

    this.setState(newState);
    this.props.onNodeMove(newState, this.props.data[nodeKey], shiftKey);
  };

  handleDragStart = () => {
    this.setState({ dragging: true });
  };

  handleDragEnd = event => {
    if (!this.nodeRef.current) {
      return;
    }

    const { x, y, drawingEdge } = this.state;
    const { data, nodeKey, onNodeSelected, onNodeUpdate } = this.props;
    const { sourceEvent } = event;

    this.setState({
      mouseDown: false,
      drawingEdge: false,
      pointerOffset: null,
    });

    if (this.oldSibling && this.oldSibling.parentElement) {
      this.oldSibling.parentElement.insertBefore(
        this.nodeRef.current.parentElement,
        this.oldSibling
      );
    }

    const shiftKey = sourceEvent.shiftKey;

    onNodeUpdate({ x, y }, data[nodeKey], shiftKey || drawingEdge);

    onNodeSelected(data, data[nodeKey], shiftKey || drawingEdge, sourceEvent);
  };

  onClick(e) {
    const { data, onNodeSelected, nodeKey } = this.props;

    onNodeSelected(data, data[nodeKey], false, e);
  }

  render() {
    const { opacity, id, data } = this.props;
    const { x, y } = this.state;
    const { extra_classes } = data;
    const className = GraphUtils.classNames(
      'node',
      extra_classes,
      data.type,
      {}
    );

    const coords = {
      x: x,
      y: y,
      width: 300,
      height: 211,
    };

    const ports = [
      {
        port: '9080',
        name: 'http',
        proto: 'tcp',
      },
      {
        port: '50051',
        name: 'grpc',
        proto: 'tcp',
      },
    ];

    return (
      <g
        id={id}
        ref={this.nodeRef}
        className={className}
        width={coords.width}
        height={coords.height}
        opacity={opacity}
        transform={`translate(${coords.x}, ${coords.y})`}
        onClick={this.onClick.bind(this)}
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
                  <h3 className="name">coreapi</h3>
                  <h4 className="namespace">jobs-demo</h4>
                </hgroup>
                <a href="#" className="service-settings">
                  <i className="fa fa-cog"></i>
                </a>
              </header>
              <section className="service-port-wrapper">
                {ports.map(port => {
                  return (
                    <div key={port.port} className="service-protocol-wrapper">
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
              <g key={port.port} id={id + '-' + port.port + '-group'}>
                <path
                  id={id + '-' + port.port + '-path'}
                  className="proto-connector-line invisible"
                  d={'M2,' + (52 + 18 + i * 36) + 'l18,0'}
                />
                <circle
                  id={id + '-' + port.port + '-circle'}
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
