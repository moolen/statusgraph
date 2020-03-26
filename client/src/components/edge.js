import * as d3 from 'd3';
import * as React from 'react';
import { intersect, shape } from 'svg-intersections';
import { Point2D, Matrix2D } from 'kld-affine';
import { Intersection } from 'kld-intersections';
import { GraphUtils } from 'react-digraph';
import './edge.scss';

import { REGULAR_EDGE_TYPE, SERVICE_TYPE } from '../graph-config'; // Configures node/edge types

class Edge extends React.Component {
  static defaultProps = {
    edgeHandleSize: 50,
    isSelected: false,
    rotateEdgeHandle: true,
  };

  static getTheta(pt1, pt2) {
    const xComp = (pt2.x || 0) - (pt1.x || 0);
    const yComp = (pt2.y || 0) - (pt1.y || 0);
    const theta = Math.atan2(yComp, xComp);

    return theta;
  }

  static lineFunction(srcTrgDataArray) {
    // Provides API for curved lines using .curve() Example:
    // https://bl.ocks.org/d3indepth/64be9fc39a92ef074034e9a8fb29dcce
    return d3
      .line()
      .curve(d3.curveBasis)
      .x(d => {
        return d.x;
      })
      .y(d => {
        return d.y;
      })(srcTrgDataArray);
  }

  static getArrowSize(viewWrapperElem = document) {
    const defEndArrowElement = viewWrapperElem.querySelector(
      `defs>marker>.arrow`
    );

    return defEndArrowElement.getBoundingClientRect();
  }

  static getEdgePathElement(edge, viewWrapperElem = document) {
    return viewWrapperElem.querySelector(
      `#edge-${edge.source}-${edge.target}-container>.edge-container>.edge>.edge-path`
    );
  }

  static parsePathToXY(edgePathElement) {
    const response = {
      source: { x: 0, y: 0 },
      target: { x: 0, y: 0 },
    };

    if (edgePathElement) {
      let d = edgePathElement.getAttribute('d');

      d = d && d.replace(/^M/, '');
      d = d && d.replace(/L/, ',');
      let dArr = (d && d.split(',')) || [];

      dArr = dArr.map(dimension => {
        return parseFloat(dimension);
      });

      if (dArr.length === 4) {
        response.source.x = dArr[0];
        response.source.y = dArr[1];
        response.target.x = dArr[2];
        response.target.y = dArr[3];
      }
    }

    return response;
  }

  static getDefaultIntersectResponse() {
    return {
      xOff: 0,
      yOff: 0,
      intersect: {
        type: 'none',
        point: {
          x: 0,
          y: 0,
        },
      },
    };
  }

  static getRotatedRectIntersect(
    defSvgRotatedRectElement,
    src,
    trg,
    includesArrow,
    viewWrapperElem = document
  ) {
    const response = Edge.getDefaultIntersectResponse();
    const arrowSize = Edge.getArrowSize(viewWrapperElem);
    const clientRect = defSvgRotatedRectElement.getBoundingClientRect();

    const widthAttr = defSvgRotatedRectElement.getAttribute('width');
    const heightAttr = defSvgRotatedRectElement.getAttribute('height');
    const w = widthAttr ? parseFloat(widthAttr) : clientRect.width;
    const h = heightAttr ? parseFloat(heightAttr) : clientRect.height;
    const trgX = trg.x || 0;
    const trgY = trg.y || 0;
    const srcX = src.x || 0;
    const srcY = src.y || 0;

    const top = trgY - h / 2;
    const bottom = trgY + h / 2;
    const left = trgX - w / 2;
    const right = trgX + w / 2;

    const line = shape('line', { x1: srcX, y1: srcY, x2: trgX, y2: trgY });

    // define rectangle
    const rect = {
      topLeft: new Point2D(left, top),
      bottomRight: new Point2D(right, bottom),
    };

    // convert rectangle corners to polygon (list of points)
    const poly = [
      rect.topLeft,
      new Point2D(rect.bottomRight.x, rect.topLeft.y),
      rect.bottomRight,
      new Point2D(rect.topLeft.x, rect.bottomRight.y),
    ];

    // find center point of rectangle
    const center = rect.topLeft.lerp(rect.bottomRight, 0.5);

    // get the rotation
    const transform = defSvgRotatedRectElement.getAttribute('transform');
    let rotate = transform
      ? transform.replace(/(rotate.[0-9]*.)|[^]/g, '$1')
      : null;
    let angle = 0;

    if (rotate) {
      // get the number
      rotate = rotate.replace(/^rotate\(|\)$/g, '');
      // define rotation in radians
      angle = (parseFloat(rotate) * Math.PI) / 180.0;
    }

    // create matrix for rotating around center of rectangle
    const rotation = Matrix2D.rotationAt(angle, center);
    // create new rotated polygon
    const rotatedPoly = poly.map(p => p.transform(rotation));

    // find intersections
    const pathIntersect = Intersection.intersectLinePolygon(
      line.params[0],
      line.params[1],
      rotatedPoly
    );

    if (pathIntersect.points.length > 0) {
      let arrowWidth = 0; //arrowSize.width;
      let arrowHeight = 0; //arrowSize.height;
      const xIntersect = pathIntersect.points[0].x;
      const yIntersect = pathIntersect.points[0].y;

      if (xIntersect > left && xIntersect < right && yIntersect > trgY) {
        // arrow points to the bottom of the node
        arrowHeight = arrowSize.height;
      } else if (xIntersect > left && xIntersect < right && yIntersect < trgY) {
        // arrow points to the top of the node
        arrowHeight = -arrowSize.height;
      } else if (yIntersect > top && yIntersect < bottom && xIntersect < trgX) {
        // arrow points to the left of the node
        arrowWidth = -arrowSize.width;
      } else {
        // arrow points to the right of the node
        arrowWidth = arrowSize.width;
      }

      response.xOff =
        trgX - xIntersect - (includesArrow ? arrowWidth / 1.25 : 0);
      response.yOff =
        trgY - yIntersect - (includesArrow ? arrowHeight / 1.25 : 0);
      response.intersect = pathIntersect.points[0];
    }

    return response;
  }

  static getPathIntersect(
    defSvgPathElement,
    src,
    trg,
    includesArrow = true,
    viewWrapperElem = document
  ) {
    const response = Edge.getDefaultIntersectResponse();
    const arrowSize = Edge.getArrowSize(viewWrapperElem);
    // get the rectangular area around path
    const clientRect = defSvgPathElement.getBoundingClientRect();

    const w = clientRect.width;
    const h = clientRect.height;
    const trgX = trg.x || 0;
    const trgY = trg.y || 0;
    const srcX = src.x || 0;
    const srcY = src.y || 0;

    // calculate the positions of each corner relative to the trg position
    const top = trgY - h / 2;
    const bottom = trgY + h / 2;
    const left = trgX - w / 2;
    const right = trgX + w / 2;

    // modify the d property to add top and left to the x and y positions
    let d = defSvgPathElement.getAttribute('d');

    if (!/^M/.test(d)) {
      // doesn't look like what we expect.
      // TODO: add more use cases than simple moveTo commands
      return;
    }

    d = d.replace(/^M /, '');
    let dArr = d.split(/[ ,]+/);

    dArr = dArr.map((val, index) => {
      let isEnd = false;

      if (/Z$/.test(val)) {
        val = val.replace(/Z$/, '');
        isEnd = true;
      }

      // index % 2 are x positions
      if (index % 2 === 0) {
        return parseFloat(val) + left + (isEnd ? 'Z' : '');
      }

      return parseFloat(val) + top + (isEnd ? 'Z' : '');
    });

    const pathIntersect = intersect(
      shape('path', { d: 'M ' + dArr.join(' ') }),
      shape('line', { x1: srcX, y1: srcY, x2: trgX, y2: trgY })
    );

    if (pathIntersect.points.length > 0) {
      let arrowWidth = 0; //arrowSize.width;
      let arrowHeight = 0; //arrowSize.height;
      const xIntersect = pathIntersect.points[0].x;
      const yIntersect = pathIntersect.points[0].y;
      let multiplier = 1;

      if (xIntersect > left && xIntersect < right) {
        const yIntersectDiff = yIntersect - trgY;

        multiplier = yIntersect < trgY ? -1 : 1;

        arrowHeight = arrowSize.height * multiplier;
        // Math.min is used to find a percentage of the arrow size
        // as the arrow approaches a horizontal or vertical vector
        // Math.abs is used to force the diff to be positive,
        // because we're using a multiplier instead and Math.min would choose a large
        // negative number as the minimum, which is undesirable.
        arrowHeight = arrowHeight * Math.min(Math.abs(yIntersectDiff), 1);
      }

      if (yIntersect > top && yIntersect < bottom) {
        const xIntersectDiff = xIntersect - trgX;

        multiplier = xIntersect < trgX ? -1 : 1;

        arrowWidth = arrowSize.width * multiplier;
        arrowWidth = arrowWidth * Math.min(Math.abs(xIntersectDiff), 1);
      }

      response.xOff =
        trgX - xIntersect - (includesArrow ? arrowWidth / 1.25 : 0);
      response.yOff =
        trgY - yIntersect - (includesArrow ? arrowHeight / 1.25 : 0);

      response.intersect = pathIntersect.points[0];
    }

    return response;
  }

  static getCircleIntersect(
    defSvgCircleElement,
    src,
    trg,
    includesArrow = true,
    viewWrapperElem = document
  ) {
    const response = Edge.getDefaultIntersectResponse();
    const arrowSize = Edge.getArrowSize(viewWrapperElem);
    const arrowWidth = arrowSize.width;
    const arrowHeight = arrowSize.height;
    const clientRect = defSvgCircleElement.getBoundingClientRect();
    const parentElement = defSvgCircleElement.parentElement;
    let parentWidth = parentElement.getAttribute('width');
    let parentHeight = parentElement.getAttribute('width');

    if (parentWidth) {
      parentWidth = parseFloat(parentWidth);
    }

    if (parentHeight) {
      parentHeight = parseFloat(parentHeight);
    }

    const w = parentWidth ? parentWidth : clientRect.width;
    const h = parentHeight ? parentHeight : clientRect.height;
    const trgX = trg.x || 0;
    const trgY = trg.y || 0;
    const srcX = src.x || 0;
    const srcY = src.y || 0;
    // from the center of the node to the perimeter
    const arrowOffsetDiviser = 1.25;
    const offX = w / 2 + (includesArrow ? arrowWidth / arrowOffsetDiviser : 0);
    const offY = h / 2 + (includesArrow ? arrowHeight / arrowOffsetDiviser : 0);

    // Note: even though this is a circle function, we can use ellipse
    // because all circles are ellipses but not all ellipses are circles.
    const pathIntersect = intersect(
      shape('ellipse', {
        rx: offX,
        ry: offY,
        cx: trgX,
        cy: trgY,
      }),
      shape('line', { x1: srcX, y1: srcY, x2: trgX, y2: trgY })
    );

    if (pathIntersect.points.length > 0) {
      const xIntersect = pathIntersect.points[0].x;
      const yIntersect = pathIntersect.points[0].y;

      response.xOff = trgX - xIntersect;
      response.yOff = trgY - yIntersect;
      response.intersect = pathIntersect.points[0];
    }

    return response;
  }

  static calculateOffset(
    nodeSize,
    src,
    trg,
    nodeKey,
    includesArrow = true,
    viewWrapperElem = document
  ) {
    let response = Edge.getDefaultIntersectResponse();

    if (!trg[nodeKey]) {
      return response;
    }

    // Note: document.getElementById is by far the fastest way to get a node.
    // compare 2.82ms for querySelector('#node-a2 use.node') vs
    // 0.31ms and 99us for document.getElementById()
    const nodeElem = document.getElementById(`node-${trg[nodeKey]}`);

    if (!nodeElem) {
      return response;
    }

    const trgNode = nodeElem.querySelector(`use.node`);

    // the test for trgNode.getAttributeNS makes sure we really have a node and not some other type of object
    if (!trgNode || (trgNode && !trgNode.getAttributeNS)) {
      return response;
    }

    const xlinkHref = trgNode.getAttributeNS(
      'http://www.w3.org/1999/xlink',
      'href'
    );

    if (!xlinkHref) {
      return response;
    }

    const defSvgRectElement = viewWrapperElem.querySelector(
      `defs>${xlinkHref} rect:not([data-intersect-ignore=true])`
    );
    // Conditionally trying to select the element in other ways is faster than trying to
    // do the selection.
    const defSvgPathElement = !defSvgRectElement
      ? viewWrapperElem.querySelector(
          `defs>${xlinkHref} path:not([data-intersect-ignore=true])`
        )
      : null;
    const defSvgCircleElement =
      !defSvgPathElement && !defSvgPathElement
        ? viewWrapperElem.querySelector(
            `defs>${xlinkHref} circle:not([data-intersect-ignore=true]), defs>${xlinkHref} ellipse:not([data-intersect-ignore=true]), defs>${xlinkHref} polygon:not([data-intersect-ignore=true])`
          )
        : null;

    if (defSvgRectElement) {
      // it's a rectangle
      response = {
        ...response,
        ...Edge.getRotatedRectIntersect(
          defSvgRectElement,
          src,
          trg,
          includesArrow,
          viewWrapperElem
        ),
      };
    } else if (defSvgPathElement) {
      // it's a complex path
      response = {
        ...response,
        ...Edge.getPathIntersect(
          defSvgPathElement,
          src,
          trg,
          includesArrow,
          viewWrapperElem
        ),
      };
    } else {
      // it's a circle or some other type
      response = {
        ...response,
        ...Edge.getCircleIntersect(
          defSvgCircleElement,
          src,
          trg,
          includesArrow,
          viewWrapperElem
        ),
      };
    }

    return response;
  }

  static getXlinkHref(edgeTypes, data) {
    if (data.type && edgeTypes[data.type]) {
      return edgeTypes[data.type].shapeId;
    } else if (edgeTypes.emptyEdge) {
      return edgeTypes.emptyEdge.shapeId;
    }

    return null;
  }

  edgeOverlayRef;

  constructor(props) {
    super(props);
    this.edgeOverlayRef = React.createRef();
  }

  getEdgeHandleTranslation = () => {
    const { data } = this.props;

    let pathDescription = this.getPathDescription(data);

    pathDescription = pathDescription.replace(/^M/, '');
    pathDescription = pathDescription.replace(/L/, ',');
    const pathDescriptionArr = pathDescription.split(',');

    // [0] = src x, [1] = src y
    // [2] = trg x, [3] = trg y
    const diffX =
      parseFloat(pathDescriptionArr[2]) - parseFloat(pathDescriptionArr[0]);
    const diffY =
      parseFloat(pathDescriptionArr[3]) - parseFloat(pathDescriptionArr[1]);
    const x = parseFloat(pathDescriptionArr[0]) + diffX / 2;
    const y = parseFloat(pathDescriptionArr[1]) + diffY / 2;

    return `translate(${x}, ${y})`;
  };

  getEdgeHandleOffsetTranslation = () => {
    const offset = -(this.props.edgeHandleSize || 0) / 2;

    return `translate(${offset}, ${offset})`;
  };

  getEdgeHandleRotation = (negate = false) => {
    let rotated = false;
    const src = this.props.sourceNode;
    const trg = this.props.targetNode;
    let theta = (Edge.getTheta(src, trg) * 180) / Math.PI;

    if (negate) {
      theta = -theta;
    }

    if (theta > 90 || theta < -90) {
      theta = theta + 180;
      rotated = true;
    }

    return [`rotate(${theta})`, rotated];
  };

  getPathDescription(edge) {
    const {
      sourceNode,
      targetNode,
      nodeKey,
      nodeSize,
      viewWrapperElem,
    } = this.props;

    const trgX = targetNode && targetNode.x ? targetNode.x : 0;
    const trgY = targetNode && targetNode.y ? targetNode.y : 0;
    const srcX = targetNode && sourceNode.x ? sourceNode.x : 0;
    const srcY = targetNode && sourceNode.y ? sourceNode.y : 0;

    const srcOff = Edge.calculateOffset(
      nodeSize || 0,
      targetNode,
      sourceNode,
      nodeKey,
      false,
      viewWrapperElem
    );
    const trgOff = Edge.calculateOffset(
      nodeSize || 0,
      sourceNode,
      targetNode,
      nodeKey,
      true,
      viewWrapperElem
    );

    let linePoints = [
      {
        x: srcX - srcOff.xOff,
        y: srcY - srcOff.yOff,
      },
      {
        x: trgX - trgOff.xOff,
        y: trgY - trgOff.yOff,
      },
    ];

    // To calculate the offset for a specific node we use that node as the third parameter
    // and the accompanying node as the second parameter, representing where the line
    // comes from and where it's going to. Don't think of a line as a one-way arrow, but rather
    // a connection between two points. In this case, to obtain the offsets for the src we
    // write trg first, then src second. Vice versa to get the offsets for trg.

    if (edge.type == REGULAR_EDGE_TYPE) {
      // we dont care for now
    }

    if (targetNode.type == SERVICE_TYPE) {
      const source = document.getElementById(`node-${sourceNode.id}`);
      const target = document.getElementById(
        `node-${targetNode.id}-${edge.target_port}-circle`
      );

      if (source && target) {
        const sbbox = source.getBBox();
        const tbbox = target.getBBox();

        linePoints = [
          {
            x: sourceNode.x + sbbox.width - 4,
            y: sourceNode.y + 21,
          },
          {
            x: sourceNode.x + sbbox.width + 40,
            y: sourceNode.y + 21,
          },
          {
            x: trgX + (tbbox.x + tbbox.width / 2) - 40,
            y: trgY + (tbbox.y + tbbox.height / 2),
          },
          {
            x: trgX + (tbbox.x + tbbox.width / 2),
            y: trgY + (tbbox.y + tbbox.height / 2),
          },
        ];

        target.classList.remove('invisible');
        target.previousSibling.classList.remove('invisible');

        return Edge.lineFunction(linePoints);
      }
    }

    return Edge.lineFunction(linePoints);
  }

  render() {
    const { data, viewWrapperElem } = this.props;

    if (!viewWrapperElem) {
      return null;
    }

    const id = `${data.source || ''}_${data.target}`;
    const className = GraphUtils.classNames('edge', {
      selected: this.props.isSelected,
    });

    return (
      <g
        className={'edge-container ' + data.type}
        data-source={data.source}
        data-target={data.target}
      >
        <g className={className}>
          <path
            className="edge-path"
            d={this.getPathDescription(data) || undefined}
          />
        </g>
        <g className="edge-mouse-handler">
          <title>{data.handleTooltipText}</title>
          <path
            className="edge-overlay-path"
            ref={this.edgeOverlayRef}
            id={id}
            data-source={data.source}
            data-target={data.target}
            d={this.getPathDescription(data) || undefined}
          />
        </g>
      </g>
    );
  }
}

export default Edge;
