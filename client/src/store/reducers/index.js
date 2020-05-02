import { combineReducers } from 'redux';
import { graphCollectionReducer } from './graph-collection';
import { alertsReducer } from './alerts';
import { metricsReducer } from './metrics';
import { servicesReducer } from './services';
import { mappingReducer } from './mapping';

const rootReducer = combineReducers({
  graphCollection: graphCollectionReducer,
  alerts: alertsReducer,
  metrics: metricsReducer,
  services: servicesReducer,
  mapping: mappingReducer,
});

export default rootReducer;
