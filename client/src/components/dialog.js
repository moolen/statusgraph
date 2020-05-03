import * as React from 'react';
import './dialog.scss';

class Dialog extends React.Component {
  componentDidMount() {
    this.updateHeight();
  }
  componentDidUpdate() {
    this.updateHeight();
  }

  updateHeight = () => {
    const rect = this.content.getBoundingClientRect();

    this.stage.style.height = rect.height + 16;
  };

  render() {
    let children = React.Children.toArray(this.props.children);

    children = children.map(el =>
      React.cloneElement(el, {
        updateParent: this.updateHeight,
      })
    );

    return (
      <div
        className={'dialog-wrapper ' + (this.props.enabled ? 'enabled' : '')}
      >
        <div className="dialog-background"></div>
        <div className="dialog-stage" ref={el => (this.stage = el)}>
          <div className="dialog-content" ref={el => (this.content = el)}>
            {children}
          </div>
          <div className="dialog-actions"></div>
        </div>
      </div>
    );
  }
}

export default Dialog;
