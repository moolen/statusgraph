import * as React from 'react';
import AddStage from './stage-add';
import EditStage from './stage-edit';
import './titlebar.scss';

class Titlebar extends React.Component {
  state = {};

  onChange(e) {
    const { onChange } = this.props;

    const stage = this.props.availableStages.find(
      x => x.name == e.target.value
    );

    onChange(e.target.value, stage);
  }
  onAdd(stageName) {
    const { onAdd } = this.props;

    onAdd(stageName);
  }
  onUpdate(stage) {
    const { onUpdate } = this.props;

    onUpdate(stage);
  }

  onDelete(stage) {
    const { onDelete } = this.props;

    onDelete(stage);
  }

  render() {
    const { availableStages, writeLocked, selectedStage } = this.props;

    return (
      <div className="title-bar">
        <select
          ref={input => {
            this.$stageSelector = input;
          }}
          value={selectedStage}
          onChange={this.onChange.bind(this)}
          className="stage-selector"
        >
          {availableStages.map(stage => {
            return (
              <option key={stage.id} value={stage.name}>
                {stage.name}
              </option>
            );
          })}
        </select>
        <AddStage onAdd={this.onAdd.bind(this)} />
        <div className={'save-stage'} onClick={this.onUpdate.bind(this)}></div>
        <EditStage
          onUpdate={this.onUpdate.bind(this)}
          onDelete={this.onDelete.bind(this)}
          stage={selectedStage}
        />
        <div
          className={'write-lock ' + (writeLocked ? 'locked' : 'unlocked')}
          onClick={this.toggleWriteLock}
        ></div>
      </div>
    );
  }
}

export default Titlebar;
