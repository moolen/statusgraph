import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Graph from './graph.jsx';
import './app.scss';

class App extends React.Component {
  state = {
    alerts: [],
    metrics: {},
    services: {},
  };

  constructor(props) {
    super(props);
    this.syncInterval = setInterval(this.sync.bind(this), 30000);
    this.sync();

    fetch(`${window.baseUrl}/api/config/mapping`)
      .then(res => res.json())
      .then(json => {
        return this.setState({ mapping: json });
      });
  }

  sync() {
    fetch(`${window.baseUrl}/api/alerts`)
      .then(res => res.json())
      .then(json => {
        return this.setState({ alerts: json });
      });
    fetch(`${window.baseUrl}/api/metrics`)
      .then(res => res.json())
      .then(json => {
        return this.setState({ metrics: json });
      });
    fetch(`${window.baseUrl}/api/services`)
      .then(res => res.json())
      .then(json => {
        return this.setState({ services: json });
      });
  }

  render() {
    const { alerts, metrics, mapping, services } = this.state;

    return (
      <Router>
        <div>
          <Route
            exact={true}
            path="/"
            render={() => (
              <Graph
                alerts={alerts}
                metrics={metrics}
                mapping={mapping}
                services={services}
              />
            )}
          />
        </div>
      </Router>
    );
  }
}

if (typeof window !== 'undefined') {
  window.onload = () => {
    ReactDOM.render(<App />, document.getElementById('content'));
  };
}
