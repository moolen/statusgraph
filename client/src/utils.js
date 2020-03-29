import { NodeTypeMap } from './config.js';

export class GraphUtils {
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

  static serializeGraph(graph) {
    graph.nodes.map(node => {
      node.type = GraphUtils.nodeTypeToString(node.type);

      return node;
    });
    graph.edges.map(edge => {
      edge.source.type = GraphUtils.nodeTypeToString(edge.source.type);
      edge.target.type = GraphUtils.nodeTypeToString(edge.target.type);

      return edge;
    });

    return JSON.stringify(graph);
  }
  static deserializeGraph(string) {
    const graph = JSON.parse(string);

    graph.nodes.map(node => {
      node.type = GraphUtils.nodeStringToType(node.type);

      return node;
    });
    graph.edges.map(edge => {
      edge.source.type = GraphUtils.nodeStringToType(edge.source.type);
      edge.target.type = GraphUtils.nodeStringToType(edge.target.type);

      return edge;
    });

    return graph;
  }
}
