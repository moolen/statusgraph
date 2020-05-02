import fetch from 'cross-fetch';
import { GraphUtils } from '../../internal';

export const REQUEST_GRAPH_COLLECTION = 'REQUEST_GRAPH_COLLECTION';
export const RECEIVE_GRAPH_COLLECTION = 'RECEIVE_GRAPH_COLLECTION';
export const UPDATE_ACTIVE_GRAPH = 'UPDATE_ACTIVE_GRAPH';
export const REQUEST_SAVE_GRAPH = 'REQUEST_SAVE_GRAPH';
export const RECEIVE_SAVE_GRAPH = 'RECEIVE_SAVE_GRAPH';
export const REQUEST_CREATE_GRAPH = 'REQUEST_CREATE_GRAPH';
export const RECEIVE_CREATE_GRAPH = 'RECEIVE_CREATE_GRAPH';

function requestGraphCollectionAction() {
  return {
    type: REQUEST_GRAPH_COLLECTION,
  };
}

function receiveGraphCollectionAction(json) {
  return {
    type: RECEIVE_GRAPH_COLLECTION,
    items: json,
    receivedAt: Date.now(),
  };
}

export function updateActiveGraphAction(graph) {
  return {
    type: UPDATE_ACTIVE_GRAPH,
    graph,
  };
}

function requestSaveGraphAction(graph) {
  return {
    type: REQUEST_SAVE_GRAPH,
    graph,
  };
}

function receiveSaveGraphAction(graph) {
  return {
    type: RECEIVE_SAVE_GRAPH,
    graph,
  };
}

export function saveGraph(graph) {
  return dispatch => {
    dispatch(requestSaveGraphAction(graph));

    return fetch(`${window.baseUrl}api/graph/${graph.id}`, {
      method: 'POST',
      body: GraphUtils.serializeGraph(graph),
    })
      .then(response => response.json())
      .then(graph => dispatch(receiveSaveGraphAction(graph)));
  };
}

export function saveActiveGraph() {
  return (dispatch, getState) => {
    const state = getState();
    const data = state.graphCollection;

    if (data.active) {
      return dispatch(saveGraph(data.active));
    }
  };
}

function fetchGraphCollection() {
  return dispatch => {
    dispatch(requestGraphCollectionAction());

    return fetch(`${window.baseUrl}api/graph`)
      .then(response => response.json())
      .then(json =>
        json.map(graph => {
          return GraphUtils.deserializeGraph(graph);
        })
      )
      .then(json => dispatch(receiveGraphCollectionAction(json)));
  };
}

function shouldFetchGraphCollection(state) {
  const data = state.graphCollection;

  if (!data || !data.items) {
    return true;
  } else if (data.isFetching) {
    return false;
  } else {
    return data.didInvalidate;
  }
}

export function fetchGraphCollectionIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchGraphCollection(getState())) {
      return dispatch(fetchGraphCollection());
    }
  };
}

export function requestCreateGraph(name) {
  return {
    type: REQUEST_CREATE_GRAPH,
    name,
  };
}

export function receiveCreateGraph(graph) {
  return {
    type: RECEIVE_CREATE_GRAPH,
    graph,
  };
}

function createGraphRequest(name) {
  return dispatch => {
    dispatch(requestCreateGraph(name));

    return fetch(`${window.baseUrl}api/graph`, {
      method: 'POST',
      body: GraphUtils.serializeGraph({
        name: name,
        edges: [],
        nodes: [],
      }),
    })
      .then(response => response.json())
      .then(graph => dispatch(receiveCreateGraph(graph)));
  };
}

export function createGraph(name) {
  return (dispatch, getState) => {
    return dispatch(createGraphRequest(name));
  };
}
