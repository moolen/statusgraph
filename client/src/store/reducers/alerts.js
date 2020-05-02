import { REQUEST_ALERTS, RECEIVE_ALERTS } from '../actions/alerts';

function alertItems(
  state = {
    isFetching: false,
    didInvalidate: false,
    items: [],
  },
  action
) {
  switch (action.type) {
    case REQUEST_ALERTS:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });
    case RECEIVE_ALERTS:
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

export function alertsReducer(state = {}, action) {
  switch (action.type) {
    case RECEIVE_ALERTS:
    case REQUEST_ALERTS:
      return Object.assign({}, alertItems(state, action));
    default:
      return state;
  }
}
