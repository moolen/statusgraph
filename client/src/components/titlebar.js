import * as React from 'react';
import AddStage from './stage-add';
import EditStage from './stage-edit';
import './titlebar.scss';
import { GraphUtils } from '../utils';

export class Titlebar extends React.Component {
  state = {
    selectedStage: '',
    availableStages: [],
  };

  // constructor(props) {
  //   super(props);
  //   // TODO enable sync
  //   //this.syncStages();
  // }

  onChange(e) {
    const { onChange } = this.props;

    const stage = this.props.availableStages.find(
      x => x.name == e.target.value
    );

    this.setState({
      selectedStage: e.target.value,
    });

    onChange(e.target.value, stage);
  }

  syncStages() {
    fetch('http://localhost:8000/api/graph', {})
      .then(res => res.json())
      .then(data => {
        if (data.length == 0) {
          data = [
            {
              name: 'default',
              edges: [],
              nodes: [],
            },
          ];
        }

        data = data.map(graph => {
          return GraphUtils.deserializeGraph(graph);
        });

        this.setState({
          selectedStage: data[0].name,
          availableStages: data,
          graph: data[0],
        });
        this.props.onChange(data[0].name, data[0]);
      });
  }

  onAdd(stageName) {
    fetch(`http://localhost:8000/api/graph`, {
      method: 'POST',
      body: GraphUtils.serializeGraph({
        name: stageName,
        edges: [],
        nodes: [],
      }),
    })
      .then(res => res.json())
      .then(graph => {
        graph = GraphUtils.deserializeGraph(graph);
        const { availableStages } = this.state;

        this.setState({
          selectedStage: stageName,
          availableStages: [{ name: stageName, graph }, ...availableStages],
          graph,
        });

        this.props.onChange(stageName, graph);
      });
  }
  onUpdate(stageName) {
    const { graph } = this.props;
    const { availableStages } = this.state;

    graph.name = stageName;

    fetch(`http://localhost:8000/api/graph/${graph.id}`, {
      method: 'POST',
      body: GraphUtils.serializeGraph(graph),
    })
      .then(res => res.json())
      .then(graph => {
        graph = GraphUtils.deserializeGraph(graph);
        this.setState({
          graph: graph,
          availableStages: availableStages,
        });
        this.props.onChange(graph.name, graph);
      });
  }

  onSave() {
    const graph = this.props;

    fetch(`http://localhost:8000/api/graph/${graph.id}`, {
      method: 'POST',
      body: GraphUtils.serializeGraph(this.props.graph),
    });
  }

  onDelete(stage) {
    fetch(`http://localhost:8000/api/graph/${this.props.graph.id}`, {
      method: 'DELETE',
    }).then(this.syncStages.bind(this));
  }

  render() {
    const { availableStages, selectedStage } = this.state;
    const { writeLocked } = this.state;

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
              <option key={stage.id || 'default'} value={stage.name}>
                {stage.name}
              </option>
            );
          })}
        </select>
        <AddStage onAdd={this.onAdd.bind(this)} />
        <div className={'save-stage'} onClick={this.onSave.bind(this)}></div>
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
