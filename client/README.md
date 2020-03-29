### Node class contract

```js

class MyNode extends React.Component{

  // new returns the data which defines the node
  //
  static new(x, y, name) {
    return {
      id: uuidv4(),
      type: MyNode, // reference class so it is called by graph/edge
      name: name,
      connector: [
        // if your class features connectors add them here
        {
          id: uuidv4(),
          port: '9080',
          name: 'http',
        },
      ],
      bounds: {
        x: x,
        y: y,
      },
      //
      // add additional data here for your implementation
      //
    };
  }

  /**
   * returns the desired position of a connector
   * @param {Object} node the node data
   * @param {Object} edgeTarget edge target connector
   * @param {String} point indicates the `source` or `target` point of the edge
   * @returns {Object} {x int, y int, offset: { x int, y int }}
   */
  static getConnectorPosition(node, edgeTarget, point) {
    return {
      // x/y position of the connector
      x: node.bounds.x - 20,
      y: node.bounds.y - 20,
      // offset indicates that there should
      // be another point in the edge's bezier curve
      // this is relative to the above
      offset: {
        x: -70,
        y: 0,
      },
    };
  }


  /**
   * A node can have multiple connectors
   * This method returns the unique id for the desired edge point
   *
   * @param {Object} edgeTarget the edge target
   */
  static getEdgeTargetID(edgeTarget) {
    return `${edgeTarget.connector}-${edgeTarget.id}`;
  }

  /**
   * This is called on drag end when the target node (this) is
   * determined. This should return the connector which should be attached
   * @param {Object} node node data
   * @returns {Object} the connector to attach to
   */
  static getConnector(node) {
    return {
      // only id is necessary
      // add more fields if necessary
      id: 'foobar',
    };
  }

  /**
   * called after the edge has been rendered. use this to update the
   * DOM if needed
   * @param {Object} node the node data
   * @param {Object} edge the edge data
   */
  static afterRenderEdge(node, edge) {}


  /**
   * this allows the node to manipulate other nodes when
   * it is being updates
   * @param {Object} graph the graph data
   * @param {Object} node the node data
   * @param {Object} pos the new position of the node
   */
  static onUpdateNodeHook(graph, node, pos) {
    // do something with the graph and return it
    graph.nodes = [...graph.nodes];
    return graph;
  }

}

// set the following properties to enable/disable certain features:

// if this node is the (source/target) of an edge
// the edge will add an additional point to the bezier curve
// depending on the position of the source/target nodes
// this will make
MyNode.SUPPORT_DYNAMIC_SOURCE_EDGE = true
MyNode.SUPPORT_DYNAMIC_TARGET_EDGE = true

```
