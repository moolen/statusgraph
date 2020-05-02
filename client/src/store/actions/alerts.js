import fetch from 'cross-fetch';

export const REQUEST_ALERTS = 'REQUEST_ALERTS';
export const RECEIVE_ALERTS = 'RECEIVE_ALERTS';

function requestAlerts() {
  return {
    type: REQUEST_ALERTS,
  };
}

function receiveAlerts(json) {
  return {
    type: RECEIVE_ALERTS,
    items: json,
    receivedAt: Date.now(),
  };
}

function fetchAlerts() {
  return dispatch => {
    dispatch(requestAlerts());

    return fetch(`${window.baseUrl}api/alerts`)
      .then(response => response.json())
      .then(json => dispatch(receiveAlerts(json)));
  };
}

function shouldFetchAlerts(state) {
  const data = state.alerts;

  if (!data || !data.items) {
    return true;
  } else if (data.isFetching) {
    return false;
  } else {
    return data.didInvalidate;
  }
}

export function fetchAlertsIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchAlerts(getState())) {
      return dispatch(fetchAlerts());
    }
  };
}
