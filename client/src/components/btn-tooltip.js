import React from 'react';
import './btn-tooltip.scss';

export default class BtnTooltip extends React.Component {
  render() {
    const { text } = this.props;

    return (
      <div className="btn-tooltip">
        <span className="btn-tooltip-text">{text}</span>
      </div>
    );
  }
}
