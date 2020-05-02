import { REQUEST_SERVICES, RECEIVE_SERVICES } from '../actions/services';

function alertItems(
  state = {
    isFetching: false,
    didInvalidate: false,
    items: [],
  },
  action
) {
  switch (action.type) {
    case REQUEST_SERVICES:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });
    case RECEIVE_SERVICES:
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

export function servicesReducer(state = {}, action) {
  switch (action.type) {
    case RECEIVE_SERVICES:
    case REQUEST_SERVICES:
      return Object.assign({}, alertItems(state, action));
    default:
      return state;
  }
}
