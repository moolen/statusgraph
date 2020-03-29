import { Rect, Poly, Diamond, Service, Cluster } from './internal';

// node types
export const NODE_TYPE_RECT = 'rect';
export const NODE_TYPE_POLY = 'poly';
export const NODE_TYPE_DIAMOND = 'diamond';
export const NODE_TYPE_SERVICE = 'service';
export const NODE_TYPE_CLUSTER = 'cluster';

export const nodeTypes = [
  NODE_TYPE_RECT,
  NODE_TYPE_SERVICE,
  NODE_TYPE_POLY,
  NODE_TYPE_DIAMOND,
  NODE_TYPE_CLUSTER,
];

// render layers
export const LAYER_BACKGROUND = 'background';
export const LAYER_EDGE = 'edge';
export const LAYER_NODE = 'node';

export const RenderLayers = [LAYER_BACKGROUND, LAYER_EDGE, LAYER_NODE];
export const RenderLayerMap = RenderLayers.reduce((o, v) => {
  o[v] = {};

  return o;
}, {});

export const NodeTypeMap = {
  [NODE_TYPE_RECT]: {
    class: Rect,
    layer: LAYER_NODE,
  },
  [NODE_TYPE_POLY]: {
    class: Poly,
    layer: LAYER_NODE,
  },
  [NODE_TYPE_DIAMOND]: {
    class: Diamond,
    layer: LAYER_NODE,
  },
  [NODE_TYPE_SERVICE]: {
    class: Service,
    layer: LAYER_NODE,
  },
  [NODE_TYPE_CLUSTER]: {
    class: Cluster,
    layer: LAYER_BACKGROUND,
  },
};
