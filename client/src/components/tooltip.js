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
    const alerts = this.getMatchingAlerts();
    const id = this.props.node ? this.props.node.id : '';
    const el = document.getElementById(`node-${id}`);

    if (!el || alerts.length == 0) {
      this.props.container.classList.remove('visible');

      return <div id="tooltip" className="empty" />;
    }

    this.props.container.setAttribute(
      'transform',
      el.getAttribute('transform')
    );

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
          </ul>
        </div>
      </div>
    );
  }
}

export default Tooltip;
