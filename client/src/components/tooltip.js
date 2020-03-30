import * as React from 'react';
import './tooltip.scss';
import { Sparkline, GraphUtils } from '../internal';

export class Tooltip extends React.Component {
  getMatchingAlerts() {
    const alerts = this.props.alerts || [];
    const node = this.props.node || {};

    if (alerts.length == 0 || !node.name) {
      return [];
    }

    // TODO: service_id should not be hard coded!
    return alerts.filter(alert => alert.labels.service_id == node.name);
  }

  componentDidMount() {
    this.props.container.setAttribute('width', '360px');
    this.props.container.setAttribute('height', '320px');
  }

  render() {
    let alerts = this.getMatchingAlerts();
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

    // remove certain labels
    alerts = alerts.map(x => {
      delete x.service_id;
      delete x.alert_name;

      return x;
    });

    this.props.container.setAttribute('x', bbox.x + bbox.width);
    this.props.container.setAttribute('y', bbox.y + bbox.height / 2 - 26);
    this.props.visible
      ? this.props.container.classList.add('visible')
      : this.props.container.classList.remove('visible');

    return (
      <div id="tooltip" className={this.props.visible ? 'visible' : ''}>
        <div className="left-arrow"></div>
        <div className="list-wrapper">
          <ul>
            {alerts.map(alert => (
              <li key={alert.fingerprint} className="alert-item">
                {alert.labels.alertname}
                <div className="label-list">
                  {Object.keys(alert.labels).map(key => {
                    return (
                      <div className="label-item" key={alert.fingerprint + key}>
                        {key}={alert.labels[key]}
                      </div>
                    );
                  })}
                </div>
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
