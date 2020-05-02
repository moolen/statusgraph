import fetch from 'cross-fetch';

export const REQUEST_SERVICES = 'REQUEST_SERVICES';
export const RECEIVE_SERVICES = 'RECEIVE_SERVICES';

function requestServices() {
  return {
    type: REQUEST_SERVICES,
  };
}

function receiveServices(json) {
  return {
    type: RECEIVE_SERVICES,
    items: json,
    receivedAt: Date.now(),
  };
}

function fetchServices() {
  return dispatch => {
    dispatch(requestServices());

    return fetch(`${window.baseUrl}api/services`)
      .then(response => response.json())
      .then(json => dispatch(receiveServices(json)));
  };
}

function shouldFetchServices(state) {
  const data = state.services;

  if (!data || !data.items) {
    return true;
  } else if (data.isFetching) {
    return false;
  } else {
    return data.didInvalidate;
  }
}

export function fetchServicesIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchServices(getState())) {
      return dispatch(fetchServices());
    }
  };
}
