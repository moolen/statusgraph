import * as React from 'react';
import './node-editor.scss';
import Select from 'react-select';
import { nodeTypes } from '../graph-config';

class NodeEditor extends React.Component {
  serviceIDInput = null;
  typeInput = null;
  constructor(props) {
    super(props);
    this.state = {
      editValues: {
        service_id: props.node.service_id || '',
        title: props.node.title || '',
        type: props.node.type || '',
        children: props.node.children || [],
      },
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      this.props.node.service_id !== undefined &&
      this.props.node != prevProps.node
    ) {
      this.setState({
        editValues: {
          service_id: this.props.node.service_id || '',
          type: this.props.node.type || '',
          children: this.props.node.children || [],
          title: this.props.node.title || '',
        },
      });
      this.serviceIDInput.focus();
    }
  }

  handleInputKeydown(e) {
    if (e.key == 'Enter') {
      this.onSubmit();

      return;
    }
  }

  handleTextChange(e) {
    const values = this.state.editValues;
    const field = e.target.getAttribute('name');

    values[field] = e.target.value;
    this.setState({ editValues: values });
  }

  validate() {
    const errors = [];

    if (
      this.state.editValues.type == 'cluster' &&
      this.state.editValues.children.length == 0
    ) {
      errors.push('children can not be empty');
    }

    if (errors.length > 0) {
      return errors.join(' ');
    }

    return null;
  }

  onSubmit(e) {
    const err = this.validate();

    if (err) {
      alert(err);

      return;
    }

    const oldNode = {};
    const newNode = {};

    Object.assign(oldNode, this.props.node);
    Object.assign(newNode, this.props.node, this.state.editValues);

    if (this.props.onNodeEditChange) {
      this.props.onNodeEditChange(oldNode, newNode);
    }
  }

  onAbort(e) {
    if (this.props.onNodeEditExit) {
      this.props.onNodeEditExit();
    }
  }

  handleChildrenChange = children => {
    const v = this.state.editValues;

    if (children == null) {
      v.children = [];
    } else {
      v.children = children.map(x => x.value);
    }

    this.setState({ editValues: v });
  };

  handleTypeChange = type => {
    const v = this.state.editValues;

    v.type = type.value;
    this.setState({ editValues: v });
  };

  render() {
    const style = {
      left: this.props.x + 20,
      top: this.props.y + 20,
    };
    const ev = this.state.editValues;

    const allChildren = this.props.nodes
      .filter(node => node.type != 'cluster')
      .filter(node => node.id != this.props.node.id)
      .map(node => {
        return {
          value: node.id,
          label: node.title || node.service_id || node.id,
        };
      });
    const selectedChildren = allChildren.filter(x =>
      ev.children.includes(x.value)
    );

    return (
      <div
        className={'form node-editor ' + (this.props.enabled ? 'enabled' : '')}
        style={style}
      >
        <div className="left-arrow"></div>
        <div className="form-row">
          <label>Service ID</label>
          <input
            type="text"
            ref={input => {
              this.serviceIDInput = input;
            }}
            onKeyDown={this.handleInputKeydown.bind(this)}
            onChange={this.handleTextChange.bind(this)}
            name="service_id"
            value={ev.service_id}
          />
        </div>
        <div className="form-row">
          <label>Title</label>
          <input
            type="text"
            ref={input => {
              this.titleInput = input;
            }}
            onKeyDown={this.handleInputKeydown.bind(this)}
            onChange={this.handleTextChange.bind(this)}
            name="title"
            value={ev.title}
          />
        </div>
        <div className="form-row select-row">
          <label>Type</label>
          <Select
            className="selector"
            value={{ value: ev.type, label: ev.type }}
            onChange={this.handleTypeChange}
            options={nodeTypes.map(x => {
              return { value: x, label: x };
            })}
          />
        </div>
        {ev.type == 'cluster' && (
          <div className="form-row select-row">
            <label>Children</label>
            <Select
              className="selector"
              isMulti={true}
              isSearchable={true}
              value={selectedChildren}
              onChange={this.handleChildrenChange}
              options={allChildren}
            />
          </div>
        )}
        <div className="form-row button-row">
          <button className="btn primary" onClick={this.onSubmit.bind(this)}>
            Save
          </button>
          <button className="btn light" onClick={this.onAbort.bind(this)}>
            Abort
          </button>
        </div>
      </div>
    );
  }
}

export default NodeEditor;
