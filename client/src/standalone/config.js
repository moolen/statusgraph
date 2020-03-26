import Rect from './nodes/rect';
import Service from './nodes/service';

export const NODE_TYPE_RECT = 'rect';
export const NODE_TYPE_SERVICE = 'service';

export const nodeTypes = [NODE_TYPE_RECT, NODE_TYPE_SERVICE];

export const NodeClassMap = {
  [NODE_TYPE_RECT]: Rect,
};

export const NodeTypeMap = {
  rect: Rect,
  service: Service,
};
