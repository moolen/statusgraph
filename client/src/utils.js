import { NodeTypeMap, EdgeTypeMap } from './internal';
import clonedeep from 'lodash.clonedeep';

export class GraphUtils {
  static edgeTypeToString(t) {
    return Object.keys(EdgeTypeMap).find(k => EdgeTypeMap[k].class == t);
  }

  static edgeStringToType(s) {
    const key = Object.keys(EdgeTypeMap).find(k => k == s);

    return EdgeTypeMap[key].class;
  }

  static nodeTypeToString(t) {
    return Object.keys(NodeTypeMap).find(k => NodeTypeMap[k].class == t);
  }

  static nodeStringToType(s) {
    const key = Object.keys(NodeTypeMap).find(k => k == s);

    return NodeTypeMap[key].class;
  }

  /**
   * The node container is referenced by multiple objects,
   * this is the central place for the configuration
   * @param {String} id node id
   */
  static getNodeContainerById(id) {
    return `${id}-container`;
  }

  static getRenderLayer(t) {
    const s = GraphUtils.nodeTypeToString(t);

    if (!s) {
      console.warn(`could not get node string for`, t);
    }

    return NodeTypeMap[s].layer;
  }

  static getNodeIndexById(nodes, id) {
    return nodes.findIndex(node => {
      return node.id === id;
    });
  }

  static getNodeByID(nodes, id) {
    return nodes.find(node => node.id == id);
  }

  static getEdgeByID(edges, id) {
    return edges.find(edge => edge.id == id);
  }

  static serializeGraph(g) {
    const graph = clonedeep(g);

    graph.nodes.map(node => {
      node.type = GraphUtils.nodeTypeToString(node.type);

      return node;
    });
    graph.edges.map(edge => {
      edge.type = GraphUtils.edgeTypeToString(edge.type);
      edge.source.type = GraphUtils.nodeTypeToString(edge.source.type);
      edge.target.type = GraphUtils.nodeTypeToString(edge.target.type);

      return edge;
    });

    return JSON.stringify(graph);
  }

  // operates on the object reference
  static deserializeGraph(graph) {
    graph.nodes.map(node => {
      node.type = GraphUtils.nodeStringToType(node.type);

      return node;
    });
    graph.edges.map(edge => {
      edge.type = GraphUtils.edgeStringToType(edge.type);
      edge.source.type = GraphUtils.nodeStringToType(edge.source.type);
      edge.target.type = GraphUtils.nodeStringToType(edge.target.type);

      return edge;
    });

    return graph;
  }

  static getGridPosition(pos) {
    const { x, y } = pos;

    pos.x = GraphUtils.gridify(x);
    pos.y = GraphUtils.gridify(y);

    return pos;
  }

  static gridify(n) {
    const gridSpacing = 16;
    const gridSnap = gridSpacing / 2;
    const rest = n % gridSpacing;

    if (rest == 0) {
      return n;
    }

    if (rest < gridSnap) {
      return n - rest;
    }

    return n - rest + gridSpacing;
  }
}
