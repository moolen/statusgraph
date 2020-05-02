import { REQUEST_METRICS, RECEIVE_METRICS } from '../actions/metrics';

function metricItems(
  state = {
    isFetching: false,
    didInvalidate: false,
    items: [],
  },
  action
) {
  switch (action.type) {
    case REQUEST_METRICS:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });
    case RECEIVE_METRICS:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.items,
        lastUpdated: action.receivedAt,
      });
    default:
      return state;
  }
}

export function metricsReducer(state = {}, action) {
  switch (action.type) {
    case RECEIVE_METRICS:
    case REQUEST_METRICS:
      return Object.assign({}, metricItems(state, action));
    default:
      return state;
  }
}
