import * as React from 'react';
//import AddStage from './stage-add';
//import EditStage from './stage-edit';
import './titlebar.scss';
import { withRouter } from 'react-router-dom';
//import { GraphUtils, ExampleGraph } from '../internal';

class Titlebar extends React.Component {
  state = {
    selectedStage: '',
  };
  onUpdate(stageName) {
    // const { graph } = this.props;
    // const { availableStages } = this.state;
    // const idx = availableStages.findIndex(s => s.id == graph.id);
    // availableStages[idx].name = stageName;
    // graph.name = stageName;
    // fetch(`${window.baseUrl}api/graph/${graph.id}`, {
    //   method: 'POST',
    //   body: GraphUtils.serializeGraph(graph),
    // })
    //   .then(res => res.json())
    //   .then(data => {
    //     this.setState({
    //       graph: graph,
    //       availableStages: availableStages,
    //     });
    //     this.props.onChange(graph.name, graph);
    //   });
  }

  onDelete() {
    // const { graph } = this.props;
    // fetch(`${window.baseUrl}api/graph/${graph.id}`, {
    //   method: 'DELETE',
    // }).then(this.syncStages.bind(this));
  }

  navigate = target => e => {
    e.preventDefault();
    this.props.history.push(target);
  };

  render() {
    const indicator = <span className="nav-indicator"></span>;
    const { active } = this.props;

    return (
      <div>
        <div className="title-bar">
          <div className="left">
            <h1 className="title">Statusgraph</h1>
          </div>
          <div className="right">
            <ul className="nav-list">
              <li>
                <a href="/alerts" onClick={this.navigate('/alerts')}>
                  Alerts{active == 'alerts' ? indicator : ''}
                </a>
              </li>
              <li>
                <a href="/graph" onClick={this.navigate('/graph')}>
                  Graph{active == 'graph' ? indicator : ''}
                </a>
              </li>
              <li>
                <a href="/metrics" onClick={this.navigate('/metrics')}>
                  Metrics{active == 'metrics' ? indicator : ''}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Titlebar);
