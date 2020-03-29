import * as React from 'react';
import './stage-edit.scss';

class EditStage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipVisible: false,
      stage: props.stage,
      input: {
        name: props.stage || '',
      },
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.stage != prevProps.stage) {
      this.setState({
        input: {
          name: this.props.stage || '',
        },
      });
      this.nameInput.focus();
    }
  }

  onClickButton() {
    this.setState({ tooltipVisible: !this.state.tooltipVisible });
  }
  handleChange(e) {
    this.setState({ input: { name: e.target.value } });
  }
  onUpdate() {
    const { onUpdate } = this.props;

    onUpdate(this.state.input.name);

    this.setState({
      tooltipVisible: false,
      input: { name: '' },
    });
  }
  onAbort() {
    this.setState({ tooltipVisible: false });
  }
  onDelete() {
    const { onDelete } = this.props;

    onDelete();
    this.setState({ tooltipVisible: false });
  }
  render() {
    return (
      <div className="edit-stage-wrapper">
        <div
          className="edit-stage"
          onClick={this.onClickButton.bind(this)}
        ></div>
        <div
          className={
            'form add-stage-tooltip ' +
            (this.state.tooltipVisible ? 'visible' : '')
          }
        >
          <div className="up-arrow"></div>
          <div className="form-row">
            <input
              ref={input => {
                this.nameInput = input;
              }}
              type="text"
              name="stage-name"
              value={this.state.input.name}
              onChange={this.handleChange.bind(this)}
            />
          </div>
          <div className="form-row">
            <button className="btn dark" onClick={this.onUpdate.bind(this)}>
              Update
            </button>
            <button className="btn light" onClick={this.onAbort.bind(this)}>
              Abort
            </button>
            <button className="btn red" onClick={this.onDelete.bind(this)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default EditStage;
