import * as React from 'react';
import { GraphUtils } from 'react-digraph';
import GraphConfig from '../../graph-config';

const { NodeTypes } = GraphConfig;

const getNodeTypeXlinkHref = (data, nt) => {
  if (data.type && nt[data.type]) {
    return nt[data.type].shapeId;
  } else if (nt.emptyNode) {
    return nt.emptyNode.shapeId;
  }

  return null;
};

export const AfterRenderEdge = (
  id,
  element,
  edge,
  edgeContainer,
  isEdgeSelected
) => {};

const getTextOffset = (nt, type) => {
  const cfg = nt[type];

  if (cfg && cfg.textOffset) {
    return cfg.textOffset;
  }

  return 3;
};

export const RenderNodeText = (data, id, isSelected) => {
  const lineOffset = getTextOffset(NodeTypes, data.type);
  const { extra_classes } = data;
  const className = GraphUtils.classNames('node-text', extra_classes, {
    selected: isSelected,
  });

  const title = data.service_id || data.title;

  return (
    <text className={className} textAnchor="middle">
      {!!title && (
        <tspan opacity="1" x={0} dy={lineOffset} fontSize="12px">
          {title}
        </tspan>
      )}
    </text>
  );
};

export function RenderNode(nodeRef, data, index, selected, hovered) {
  const props = {
    height: 100,
    width: 100,
  };
  const nodeShapeContainerClassName = GraphUtils.classNames('shape');

  const { extra_classes } = data;
  const nodeClassName = GraphUtils.classNames('node', extra_classes, {
    selected,
    hovered,
  });

  const nodeTypeXlinkHref = getNodeTypeXlinkHref(data, NodeTypes) || '';

  // get width and height defined on def element
  const defSvgNodeElement = nodeTypeXlinkHref
    ? document.querySelector(`defs>${nodeTypeXlinkHref}`)
    : null;
  const nodeWidthAttr = defSvgNodeElement
    ? defSvgNodeElement.getAttribute('width')
    : 0;
  const nodeHeightAttr = defSvgNodeElement
    ? defSvgNodeElement.getAttribute('height')
    : 0;

  props.width = nodeWidthAttr ? parseInt(nodeWidthAttr, 10) : props.width;
  props.height = nodeHeightAttr ? parseInt(nodeHeightAttr, 10) : props.height;

  return (
    <g className={nodeShapeContainerClassName} {...props}>
      <use
        className={nodeClassName}
        x={-props.width / 2}
        y={-props.height / 2}
        width={props.width}
        height={props.height}
        xlinkHref={nodeTypeXlinkHref}
      />
    </g>
  );
}
