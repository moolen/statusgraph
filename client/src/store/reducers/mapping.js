import { REQUEST_MAPPING, RECEIVE_MAPPING } from '../actions/mapping';

function alertItems(
  state = {
    isFetching: false,
    didInvalidate: false,
    items: [],
  },
  action
) {
  switch (action.type) {
    case REQUEST_MAPPING:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });
    case RECEIVE_MAPPING:
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

export function mappingReducer(state = {}, action) {
  switch (action.type) {
    case RECEIVE_MAPPING:
    case REQUEST_MAPPING:
      return Object.assign({}, alertItems(state, action));
    default:
      return state;
  }
}
