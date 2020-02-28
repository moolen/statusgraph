import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Graph from './graph.jsx';

import './app.scss';

class App extends React.Component {
  state = {
    alerts: [],
    metrics: {},
  };

  constructor(props) {
    super(props);
    this.syncInterval = setInterval(this.sync.bind(this), 15000);
    this.sync();
  }

  sync() {
    fetch('http://localhost:8000/api/alerts')
      .then(res => res.json())
      .then(json => {
        return this.setState({ alerts: json });
      });
    fetch('http://localhost:8000/api/metrics')
      .then(res => res.json())
      .then(json => {
        return this.setState({ metrics: json });
      });
  }

  render() {
    const { alerts, metrics } = this.state;

    return (
      <Router>
        <div>
          <Route
            exact={true}
            path="/"
            render={() => <Graph alerts={alerts} metrics={metrics} />}
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
