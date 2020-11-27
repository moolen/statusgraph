import * as React from 'react';
import './node-editor.scss';
import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';

import { nodeTypes, GraphUtils } from '../internal';

export class NodeEditor extends React.Component {
  nameInput = null;
  constructor(props) {
    super(props);
    const node = props.node || {};

    this.state = {
      labelInput: '',
      showConnectors: false,
      editValues: {
        id: node.id || '',
        name: node.name || '',
        namespace: node.namespace || '',
        type: GraphUtils.nodeTypeToString(node.type) || '',
        connector: node.connector || [],
        children: node.children || [],
        labels: node.labels || [],
      },
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      this.props.node &&
      this.props.node.id !== undefined &&
      this.props.node != prevProps.node
    ) {
      this.setState({
        labelInput: '',
        editValues: {
          id: this.props.node.id || '',
          type: GraphUtils.nodeTypeToString(this.props.node.type) || '',
          connector: this.props.node.connector || [],
          children: this.props.node.children || [],
          labels: this.props.node.labels || [],
          name: this.props.node.name || '',
          namespace: this.props.node.namespace || '',
        },
      });
      this.nameInput.focus();
    }
  }

  handleInputKeydown(e) {
    if (e.key == 'Enter') {
      this.onSubmit();

      return;
    }

    e.stopPropagation();
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

    if (!this.state.editValues.type) {
      errors.push('type can not be empty');
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

    newNode.type = GraphUtils.nodeStringToType(newNode.type);

    if (this.props.onNodeEditChange) {
      this.props.onNodeEditChange(oldNode, newNode);
    }
  }

  onAbort(e) {
    if (this.props.onNodeEditExit) {
      this.props.onNodeEditExit();
    }
  }

  // TODO: this is buggy when clicking with mouse
  handleChildrenChange = children => {
    const v = this.state.editValues;

    if (children == null) {
      v.children = [];
    } else {
      v.children = children.map(x => x.value);
    }

    this.setState({ editValues: v });
  };

  handleLabelInputChange = labelInput => {
    this.setState({ labelInput });
  };

  handleLabelChange = labels => {
    const v = this.state.editValues;

    if (labels == null) {
      v.labels = [];
    } else {
      v.labels = labels.map(x => x.value);
    }

    this.setState({ editValues: v });
  };

  handleLabelKeyDown = e => {
    const ev = this.state.editValues;

    switch (e.key) {
      case 'Enter':
      case 'Tab':
        if (!ev.labels.includes(e.target.value)) {
          ev.labels.push(e.target.value);
        }

        this.setState({
          labelInput: '',
          editValues: ev,
        });

        e.preventDefault();
    }
  };

  handleTypeChange = type => {
    const v = this.state.editValues;

    v.type = type.value;

    if (v.type != 'cluster') {
      v.children = [];
    }

    if (v.type != 'service') {
      v.labels = [];
    }

    this.setState({ editValues: v });
  };

  handleConnectorTextChange = (i, e) => {
    const ev = this.state.editValues;

    const key = e.target.getAttribute('name');

    ev.connector[i][key] = e.target.value;

    this.setState({ editValues: ev });
  };

  toggleConnectors = () => {
    const { updateParent } = this.props;

    this.setState({ showConnectors: !this.state.showConnectors }, () => {
      if (updateParent) {
        updateParent();
      }
    });
  };

  onClickAddConnector = () => {
    const ev = this.state.editValues;

    ev.connector.push({
      id: uuidv4(),
      label: '',
      name: '',
    });
    this.setState({ editValues: ev });
  };

  render() {
    const ev = this.state.editValues;

    const allChildren = this.props.node
      ? this.props.nodes
          .filter(node => node.id != this.props.node.id)
          .map(node => {
            return {
              value: node.id,
              label: node.name || node.id || node.id,
            };
          })
      : [];
    const selectedChildren = allChildren.filter(x =>
      ev.children.includes(x.value)
    );

    const labels = ev.labels.map(v => {
      return { label: v, value: v };
    });

    return (
      <div className={'form node-editor'}>
        {/* <div className="form-row">
          <label>ID</label>
          <input
            type="text"

            onKeyDown={this.handleInputKeydown.bind(this)}
            onChange={this.handleTextChange.bind(this)}
            name="id"
            value={ev.id}
          />
        </div> */}
        <h3>Node Editor</h3>
        <div className="form-group">
          <div className="form-row">
            <label>Name</label>
            <input
              type="text"
              ref={input => {
                this.nameInput = input;
              }}
              onKeyDown={this.handleInputKeydown.bind(this)}
              onChange={this.handleTextChange.bind(this)}
              name="name"
              value={ev.name}
            />
          </div>
          {ev.type == 'service' && (
            <div className="form-row">
              <label>Namespace</label>
              <input
                type="text"
                onKeyDown={this.handleInputKeydown.bind(this)}
                onChange={this.handleTextChange.bind(this)}
                name="namespace"
                value={ev.namespace}
              />
            </div>
          )}
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
        {ev.type == 'service' && (
          <div className="service-form-wrapper">
            <div className="connector-wrapper">
              <div className="connector-button" onClick={this.toggleConnectors}>
                <div>Connectors ({ev.connector.length})</div>
                <i className="material-icons">
                  {this.state.showConnectors
                    ? 'keyboard_arrow_down'
                    : 'keyboard_arrow_right'}
                </i>
              </div>
              <div
                className={
                  'connector-list ' +
                  (this.state.showConnectors ? 'visible' : 'hidden')
                }
              >
                {ev.connector.map((conn, i) => {
                  return (
                    <div key={conn.id} className="form-row port-row">
                      <label>Connector {i + 1}</label>
                      <div className="port-input-wrap form-row">
                        <label>Label</label>
                        <input
                          type="text"
                          onChange={this.handleConnectorTextChange.bind(
                            this,
                            i
                          )}
                          name="label"
                          value={conn.label}
                        />
                      </div>
                      <div className="port-input-wrap form-row">
                        <label>Description</label>
                        <input
                          type="text"
                          onChange={this.handleConnectorTextChange.bind(
                            this,
                            i
                          )}
                          name="name"
                          value={conn.name}
                        />
                      </div>
                    </div>
                  );
                })}
                <button
                  className="btn add-connector primary"
                  onClick={this.onClickAddConnector}
                >
                  add connector
                </button>
              </div>
            </div>
            <div className="label-wrapper">
              <div className="form-row select-row">
                <label>Labels</label>
                <Select
                  className="selector"
                  isClearable
                  isMulti
                  menuIsOpen={false}
                  inputValue={this.state.labelInput}
                  value={labels}
                  onInputChange={this.handleLabelInputChange}
                  onChange={this.handleLabelChange}
                  onKeyDown={this.handleLabelKeyDown}
                  components={{
                    DropdownIndicator: null,
                  }}
                />
              </div>
            </div>
          </div>
        )}
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
          <button className="btn light" onClick={this.onSubmit.bind(this)}>
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
