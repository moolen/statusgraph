import Service from './nodes/service';
import { NodeTypeMap } from './config.js';

class GraphUtils {
  static getNodeClassForEdgeTarget(edgeTarget) {
    switch (edgeTarget.type) {
      case 'node':
        return Node;
      case 'service':
        return Service;
      case 'coords':
        return null;
      default:
        console.warn(`trying to get class for edgeTarget`, edgeTarget);
    }
  }

  static nodeTypeToString(t) {
    return Object.keys(NodeTypeMap).find(k => NodeTypeMap[k] == t);
  }

  static nodeStringToType(s) {
    const key = Object.keys(NodeTypeMap).find(k => k == s);

    return NodeTypeMap[key];
  }
}

export default GraphUtils;
