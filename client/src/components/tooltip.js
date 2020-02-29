import * as React from 'react';
import './tooltip.scss';

class Tooltip extends React.Component {
  getMatchingAlerts() {
    const alerts = this.props.alerts || [];
    const node = this.props.node || {};

    if (alerts.length == 0 || !node.service_id) {
      return [];
    }

    return alerts.filter(alert => alert.labels.service_id == node.service_id);
  }

  componentDidMount() {
    this.props.container.setAttribute('width', '360px');
    this.props.container.setAttribute('height', '320px');
  }

  render() {
    let alerts = this.getMatchingAlerts();
    const metrics = this.props.metrics;
    const id = this.props.node ? this.props.node.id : '';
    const sid = this.props.node ? this.props.node.service_id : '';
    const el = document.getElementById(`node-${id}`);
    let viewMetrics = [];

    if (metrics && metrics.metrics && metrics.metrics[sid]) {
      viewMetrics = Object.keys(metrics.metrics[sid]).map(metric => {
        return {
          name: metric,
          value: metrics.metrics[sid][metric],
        };
      });
    }

    if (!el || (alerts.length == 0 && viewMetrics.length == 0)) {
      this.props.container.classList.remove('visible');

      return <div id="tooltip" className="empty" />;
    }

    this.props.container.setAttribute(
      'transform',
      el.getAttribute('transform')
    );

    // remove certain labels
    alerts = alerts.map(x => {
      delete x.service_id;
      delete x.alert_name;

      return x;
    });
    const bbox = el.getBBox();

    this.props.container.setAttribute('x', bbox.width / 2);
    this.props.container.setAttribute('y', -(bbox.height / 2));
    this.props.visible
      ? this.props.container.classList.add('visible')
      : this.props.container.classList.remove('visible');

    return (
      <div id="tooltip" className={this.props.visible ? 'visible' : ''}>
        <div className="left-arrow"></div>
        <div className="list-wrapper">
          <ul>
            {alerts.map(alert => (
              <li key={alert.fingerprint}>
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
            {viewMetrics.map(metric => (
              <li key={metric.name}>
                {metric.name} : {metric.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

export default Tooltip;
