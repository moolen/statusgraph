import {
  REQUEST_GRAPH_COLLECTION,
  RECEIVE_GRAPH_COLLECTION,
  REQUEST_CREATE_GRAPH,
  RECEIVE_CREATE_GRAPH,
  UPDATE_ACTIVE_GRAPH,
} from '../actions/graph-collection';
import { ExampleGraph } from '../../internal';

function graphItems(
  state = {
    isFetching: false,
    didInvalidate: false,
    items: [],
    active: {},
  },
  action
) {
  switch (action.type) {
    case REQUEST_GRAPH_COLLECTION:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case RECEIVE_GRAPH_COLLECTION:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.items || [ExampleGraph],
        active: action.items[0] || ExampleGraph,
        lastUpdated: action.receivedAt,
      });
    default:
      return state;
  }
}

export function graphCollectionReducer(state = {}, action) {
  switch (action.type) {
    case RECEIVE_GRAPH_COLLECTION:
    case REQUEST_GRAPH_COLLECTION:
      return Object.assign({}, graphItems(state, action));
    case UPDATE_ACTIVE_GRAPH:
      return Object.assign({}, state, {
        active: action.graph,
      });
    case REQUEST_CREATE_GRAPH:
      return state; // noop
    case RECEIVE_CREATE_GRAPH:
      return Object.assign({}, state, {
        items: [...state.items, action.graph],
        active: action.graph,
      });
    default:
      return state;
  }
}
