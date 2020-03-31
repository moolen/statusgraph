import * as React from 'react';
import './tooltip.scss';
import { Sparkline, GraphUtils } from '../internal';

export class Tooltip extends React.Component {
  getMatchingAlerts() {
    const alerts = this.props.alerts || [];
    const node = this.props.node || {};
    const mapping = this.props.mapping;

    if (alerts.length == 0 || !node.name || !mapping) {
      return [];
    }

    return alerts.filter(alert => {
      const byLabel = mapping.alerts.service_labels.find(lbl => {
        if (alert.labels[lbl]) {
          return alert.labels[lbl]
            .split(',')
            .map(x => x.trim())
            .includes(node.name);
        }
      });

      if (byLabel) {
        return true;
      }

      const byAnnotation = mapping.alerts.service_annotations.find(ann => {
        if (alert.annotations[ann]) {
          return alert.annotations[ann]
            .split(',')
            .map(x => x.trim())
            .includes(node.name);
        }
      });

      if (byAnnotation) {
        return true;
      }

      return false;
    });
  }

  shortDuration = start => {
    const d = 1000 * 60 * 60 * 24;
    const h = 1000 * 60 * 60;
    const m = 1000 * 60;
    const sec = 1000;

    const delta = Date.now() - new Date(start);

    switch (true) {
      case delta > d:
        return `${Math.floor(delta / d)}d`;
      case delta < d:
        return `${Math.floor(delta / h)}h`;
      case delta < h:
        return `${Math.floor(delta / m)}m`;
      case delta < m:
        return `${Math.floor(delta / sec)}s`;
      default:
        return `${Math.floor(delta / sec)}ms`;
    }
  };

  componentDidMount() {
    this.props.container.setAttribute('width', '360px');
    this.props.container.setAttribute('height', '320px');
  }

  render() {
    const alerts = this.getMatchingAlerts();
    const metrics = this.props.metrics;
    const id = this.props.node ? this.props.node.id : '';
    const sid = this.props.node ? this.props.node.name : '';
    const containerId = GraphUtils.getNodeContainerById(id);
    const el = document.getElementById(containerId);
    let viewMetrics = [];

    if (metrics && metrics.metrics && metrics.metrics[sid]) {
      viewMetrics = metrics.metrics[sid];
    }

    if (!el || (alerts.length == 0 && viewMetrics.length == 0)) {
      this.props.container.classList.remove('visible');

      return <div id="tooltip" className="empty" />;
    }

    const bbox = el.getBBox();

    this.props.container.setAttribute('x', bbox.x + bbox.width);
    this.props.container.setAttribute('y', bbox.y + bbox.height / 2 - 26);
    this.props.visible
      ? this.props.container.classList.add('visible')
      : this.props.container.classList.remove('visible');

    return (
      <div id="tooltip" className={this.props.visible ? 'visible' : ''}>
        {/* <div className="left-arrow"></div> */}
        <div className="list-wrapper">
          <ul>
            {alerts.map(alert => (
              <li key={alert.fingerprint} className="alert-item">
                <span>
                  {alert.labels.alertname} ({this.shortDuration(alert.startsAt)}
                </span>
                )
              </li>
            ))}
            {Object.keys(viewMetrics).map(name => (
              <li key={name} className="metric-item">
                <span className="metric-num">
                  {name}:{' '}
                  {Number(
                    viewMetrics[name][viewMetrics[name].length - 1].value
                  ).toFixed(2)}
                </span>
                <Sparkline width="200" height="30" data={viewMetrics[name]} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}
