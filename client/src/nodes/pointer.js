export class Pointer {
  static getConnectorPosition(_, edgeTarget) {
    return edgeTarget.coords;
  }

  static getEdgeTargetID(_) {
    return `dragging`;
  }
}
