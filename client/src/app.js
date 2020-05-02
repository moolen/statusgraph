import * as React from 'react';
import { connect } from 'react-redux';

import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import Graph from './graph.jsx';
import Alerts from './alerts.jsx';
import Metrics from './metrics.jsx';
import Titlebar from './components/titlebar';
import './app.scss';
import { fetchGraphCollectionIfNeeded } from './store/actions/graph-collection';
import { fetchAlertsIfNeeded } from './store/actions/alerts';
import { fetchMetricsIfNeeded } from './store/actions/metrics.js';
import { fetchServicesIfNeeded } from './store/actions/services.js';
import { fetchMappingIfNeeded } from './store/actions/mapping.js';

class App extends React.Component {
  state = {
    alerts: [],
    metrics: {},
    services: {},
    mapping: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch(fetchGraphCollectionIfNeeded());
    dispatch(fetchAlertsIfNeeded());
    dispatch(fetchMetricsIfNeeded());
    dispatch(fetchServicesIfNeeded());
    dispatch(fetchMappingIfNeeded());
  }

  render() {
    const {
      alerts,
      metrics,
      mapping,
      services,
      graphCollection,
      activeGraph,
      dispatch,
    } = this.props;

    return (
      <Router>
        <div>
          <Route exact={true} path="/">
            <Redirect from="/" to="/graph" />
          </Route>
          <Route
            exact={true}
            path="/graph"
            render={() => (
              <div>
                <Titlebar active="graph" />
                <Graph
                  alerts={alerts}
                  metrics={metrics}
                  mapping={mapping}
                  services={services}
                  graphCollection={graphCollection || []}
                  activeGraph={activeGraph || {}}
                  dispatch={dispatch}
                />
              </div>
            )}
          />
          <Route
            exact={true}
            path="/alerts"
            render={() => (
              <div>
                <Titlebar active="alerts" />
                <Alerts alerts={alerts} mapping={mapping} dispatch={dispatch} />
              </div>
            )}
          />
          <Route
            exact={true}
            path="/metrics"
            render={() => (
              <div>
                <Titlebar active="metrics" />
                <Metrics
                  metrics={metrics}
                  alerts={alerts}
                  mapping={mapping}
                  dispatch={dispatch}
                />
              </div>
            )}
          />
        </div>
      </Router>
    );
  }
}

function mapStateToProps(state) {
  const { graphCollection, alerts, metrics, services, mapping } = state;

  return {
    graphCollection: graphCollection.items,
    activeGraph: graphCollection.active,
    alerts: alerts.items,
    metrics: metrics.items,
    services: services.items,
    mapping: mapping.items,
  };
}

export default connect(mapStateToProps)(App);
