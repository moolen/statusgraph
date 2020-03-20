import * as React from 'react';
import { Node } from 'react-digraph';
import Cluster from './components/cluster.js';

export const NODE_KEY = 'id'; // Key used to identify nodes

// These keys are arbitrary (but must match the config)
// However, GraphView renders text differently for empty types
// so this has to be passed in if that behavior is desired.
export const CIRCLE_TYPE = 'circle'; // Empty node type
export const POLY_TYPE = 'poly';
export const DIAMOND_TYPE = 'diamond';
export const RECT_TYPE = 'rect';
export const REGULAR_EDGE_TYPE = 'regular';
export const ACTOR_TYPE = 'actor';
export const DATABASE_TYPE = 'database';
export const CLUSTER_TYPE = 'cluster';

export const nodeTypes = [
  CIRCLE_TYPE,
  POLY_TYPE,
  DIAMOND_TYPE,
  RECT_TYPE,
  ACTOR_TYPE,
  CLUSTER_TYPE,
  DATABASE_TYPE,
];
export const edgeTypes = [REGULAR_EDGE_TYPE];

const EmptyNodeShape = (
  <symbol viewBox="0 0 100 100" width="100" height="100" id="emptyNode">
    <circle cx="50" cy="50" r="50" />
  </symbol>
);

const EmptyShape = (
  <symbol viewBox="0 0 100 100" id="circle">
    <circle cx="50" cy="50" r="45" />
  </symbol>
);

const DiamondShape = (
  <symbol viewBox="-27 0 154 154" id="diamond" width="154" height="154">
    <rect transform="translate(50) rotate(45)" width="109" height="109" />
  </symbol>
);

const DatabaseShape = (
  <symbol viewBox="0 0 84 60" id="database" width="84" height="60">
    <g>
      <rect
        width="84"
        height="60"
        fill="transparent"
        stroke="#333"
        strokeDasharray="5"
      />
      <path
        transform="translate(30, 12)"
        fill="black"
        d="M 22 18.055v2.458c0 1.925-4.655 3.487-10 3.487-5.344 0-10-1.562-10-3.487v-2.458c2.418 1.738 7.005 2.256 10 2.256 3.006 0 7.588-.523 10-2.256zm-10-3.409c-3.006 0-7.588-.523-10-2.256v2.434c0 1.926 4.656 3.487 10 3.487 5.345 0 10-1.562 10-3.487v-2.434c-2.418 1.738-7.005 2.256-10 2.256zm0-14.646c-5.344 0-10 1.562-10 3.488s4.656 3.487 10 3.487c5.345 0 10-1.562 10-3.487 0-1.926-4.655-3.488-10-3.488zm0 8.975c-3.006 0-7.588-.523-10-2.256v2.44c0 1.926 4.656 3.487 10 3.487 5.345 0 10-1.562 10-3.487v-2.44c-2.418 1.738-7.005 2.256-10 2.256z"
      />
    </g>
  </symbol>
);

const PolyShape = (
  <symbol viewBox="0 0 88 72" id="poly" width="88" height="88">
    <path d="M 0 36 18 0 70 0 88 36 70 72 18 72Z" />
  </symbol>
);

const RectShape = (
  <symbol viewBox="0 0 154 54" width="154" height="54" id="rect">
    <rect x="0" y="0" rx="2" ry="2" width="154" height="54" />
  </symbol>
);

const SpecialChildShape = (
  <symbol viewBox="0 0 200 200" width="200" height="200" id="specialChild">
    <rect
      x="2.5"
      y="0"
      width="200"
      height="200"
      fill="rgba(30, 144, 255, 0.12)"
    />
  </symbol>
);

const RegularEdgeShape = (
  <symbol viewBox="0 0 50 50" id="regular">
    <circle cx="25" cy="25" r="8" fill="currentColor" />
  </symbol>
);

const ActorShape = (
  <symbol width="60" height="60" viewBox="0 0 24 24" id="actor">
    <path d="M 19 7.001c0 3.865-3.134 7-7 7s-7-3.135-7-7c0-3.867 3.134-7.001 7-7.001s7 3.134 7 7.001zm-1.598 7.18c-1.506 1.137-3.374 1.82-5.402 1.82-2.03 0-3.899-.685-5.407-1.822-4.072 1.793-6.593 7.376-6.593 9.821h24c0-2.423-2.6-8.006-6.598-9.819z" />
  </symbol>
);

export default {
  EdgeTypes: {
    regular: {
      shape: RegularEdgeShape,
    },
  },
  NodeSubtypes: {
    specialChild: {
      shape: SpecialChildShape,
      shapeId: '#specialChild',
    },
  },
  NodeTypes: {
    emptyNode: {
      shape: EmptyNodeShape,
      shapeId: '#emptyNode',
      constructor: Node,
    },
    empty: {
      shape: EmptyShape,
      shapeId: '#empty',
      constructor: Node,
    },
    diamond: {
      shape: DiamondShape,
      shapeId: '#diamond',
      constructor: Node,
    },
    rect: {
      shape: RectShape,
      shapeId: '#rect',
      constructor: Node,
    },
    poly: {
      shape: PolyShape,
      shapeId: '#poly',
      constructor: Node,
    },
    database: {
      shape: DatabaseShape,
      shapeId: '#database',
      textOffset: 20,
      constructor: Node,
    },
    actor: {
      shape: ActorShape,
      shapeId: '#actor',
      textOffset: '48px',
      constructor: Node,
    },
    cluster: {
      shape: RectShape,
      shapeId: '#rect',
      constructor: Cluster,
    },
  },
};
