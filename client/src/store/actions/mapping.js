import fetch from 'cross-fetch';

export const REQUEST_MAPPING = 'REQUEST_MAPPING';
export const RECEIVE_MAPPING = 'RECEIVE_MAPPING';

function requestMapping() {
  return {
    type: REQUEST_MAPPING,
  };
}

function receiveMapping(json) {
  return {
    type: RECEIVE_MAPPING,
    items: json,
    receivedAt: Date.now(),
  };
}

function fetchMapping() {
  return dispatch => {
    dispatch(requestMapping());

    return fetch(`${window.baseUrl}api/config/mapping`)
      .then(response => response.json())
      .then(json => dispatch(receiveMapping(json)));
  };
}

function shouldFetchMapping(state) {
  const data = state.mapping;

  if (!data || !data.items) {
    return true;
  } else if (data.isFetching) {
    return false;
  } else {
    return data.didInvalidate;
  }
}

export function fetchMappingIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchMapping(getState())) {
      return dispatch(fetchMapping());
    }
  };
}
