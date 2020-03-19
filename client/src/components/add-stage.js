import * as React from 'react';
import './add-stage.scss';

class AddStage extends React.Component {
  state = {
    tooltipVisible: false,
    stageName: '',
  };
  showInput() {
    this.setState({ tooltipVisible: true });
  }
  handleChange(e) {
    this.setState({ stageName: e.target.value });
  }
  onSubmit() {
    if (this.props.onAdd) {
      this.props.onAdd(this.state.stageName);
    }

    this.setState({
      tooltipVisible: false,
      stageName: '',
    });
  }
  onAbort() {
    this.setState({ tooltipVisible: false });
  }
  render() {
    return (
      <div className="add-stage-wrapper">
        <div className="add-stage" onClick={this.showInput.bind(this)}></div>
        <div
          className={
            'form add-stage-tooltip ' +
            (this.state.tooltipVisible ? 'visible' : '')
          }
        >
          <div className="up-arrow"></div>
          <div className="form-row">
            <input
              type="text"
              name="stage-name"
              value={this.state.stageName}
              onChange={this.handleChange.bind(this)}
            />
          </div>
          <div className="form-row">
            <button className="btn dark" onClick={this.onSubmit.bind(this)}>
              Create
            </button>
            <button className="btn light" onClick={this.onAbort.bind(this)}>
              Abort
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AddStage;
