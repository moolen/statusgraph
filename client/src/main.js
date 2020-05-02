import React from 'react';
import * as ReactDOM from 'react-dom';
import Root from './root';

if (typeof window !== 'undefined') {
  window.onload = () => {
    ReactDOM.render(<Root />, document.getElementById('content'));
  };
}
