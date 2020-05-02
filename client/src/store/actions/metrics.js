import fetch from 'cross-fetch';

export const REQUEST_METRICS = 'REQUEST_METRICS';
export const RECEIVE_METRICS = 'RECEIVE_METRICS';

function requestMetrics() {
  return {
    type: REQUEST_METRICS,
  };
}

function receiveMetrics(json) {
  return {
    type: RECEIVE_METRICS,
    items: json,
    receivedAt: Date.now(),
  };
}

function fetchMetrics() {
  return dispatch => {
    dispatch(requestMetrics());

    return fetch(`${window.baseUrl}api/metrics`)
      .then(response => response.json())
      .then(json => dispatch(receiveMetrics(json)));
  };
}

function shouldFetchMetrics(state) {
  const data = state.metrics;

  if (!data || !data.items) {
    return true;
  } else if (data.isFetching) {
    return false;
  } else {
    return data.didInvalidate;
  }
}

export function fetchMetricsIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchMetrics(getState())) {
      return dispatch(fetchMetrics());
    }
  };
}
