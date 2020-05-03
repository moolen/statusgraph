import * as React from 'react';
import './stage-add.scss';

class AddStage extends React.Component {
  state = {
    stageName: '',
  };
  handleChange(e) {
    this.setState({ stageName: e.target.value });
  }
  onSubmit() {
    if (this.props.onAdd) {
      this.props.onAdd(this.state.stageName);
    }

    this.setState({
      stageName: '',
    });
  }
  onAbort() {
    this.setState({
      stageName: '',
    });
    this.props.onAbort();
  }
  render() {
    return (
      <div className={'form add-stage'}>
        <h3>Create new stage</h3>
        <div className="form-row">
          <label>Name</label>
          <input
            type="text"
            name="stage-name"
            value={this.state.stageName}
            onChange={this.handleChange.bind(this)}
          />
        </div>
        <div className="form-row button-row">
          <button className="btn light" onClick={this.onSubmit.bind(this)}>
            Create
          </button>
          <button className="btn light" onClick={this.onAbort.bind(this)}>
            Abort
          </button>
        </div>
      </div>
    );
  }
}

export default AddStage;
