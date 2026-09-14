import React from 'react';
import { BaseEdge, useInternalNode } from '@xyflow/react';
import { NODE_WIDTH, NODE_HEIGHT } from '../../utils/familyTreeLayout';

export function FamilyBranchEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style = {},
  markerEnd,
}) {
  const sourceNode = useInternalNode(source);
  const otherParentNode = useInternalNode(data?.otherParentId);

  let stemStartX = sourceX;
  let stemStartY = sourceY;

  if (otherParentNode && sourceNode) {
    const sPos = sourceNode.internals?.positionAbsolute || sourceNode.position || { x: sourceX, y: sourceY };
    const oPos = otherParentNode.internals?.positionAbsolute || otherParentNode.position || { x: sourceX, y: sourceY };

    const sWidth = sourceNode.measured?.width || NODE_WIDTH;
    const sHeight = sourceNode.measured?.height || NODE_HEIGHT;
    const oWidth = otherParentNode.measured?.width || NODE_WIDTH;
    const oHeight = otherParentNode.measured?.height || NODE_HEIGHT;

    // Determine marriage handle positions
    let sHandleX, oHandleX;
    if (sPos.x <= oPos.x) {
      sHandleX = sPos.x + sWidth;
      oHandleX = oPos.x;
    } else {
      sHandleX = sPos.x;
      oHandleX = oPos.x + oWidth;
    }

    const sHandleY = sPos.y + sHeight / 2;
    const oHandleY = oPos.y + oHeight / 2;

    // Exact midpoint of the marriage line between the two spouses!
    stemStartX = (sHandleX + oHandleX) / 2;
    stemStartY = (sHandleY + oHandleY) / 2;
  }

  // Calculate the bottom of the parent cards to ensure the horizontal bus
  // line is placed strictly below the parent cards and above the child card.
  let parentBottomY = stemStartY;
  if (otherParentNode && sourceNode) {
    const sPos = sourceNode.internals?.positionAbsolute || sourceNode.position || { x: sourceX, y: sourceY };
    const oPos = otherParentNode.internals?.positionAbsolute || otherParentNode.position || { x: sourceX, y: sourceY };
    const sHeight = sourceNode.measured?.height || NODE_HEIGHT;
    const oHeight = otherParentNode.measured?.height || NODE_HEIGHT;
    parentBottomY = Math.max(sPos.y + sHeight, oPos.y + oHeight);
  } else if (sourceNode) {
    const sPos = sourceNode.internals?.positionAbsolute || sourceNode.position || { x: sourceX, y: sourceY };
    const sHeight = sourceNode.measured?.height || NODE_HEIGHT;
    parentBottomY = sPos.y + sHeight;
  } else {
    parentBottomY = sourceY;
  }

  // Branch level: clean corridor halfway between parent card bottoms and child card top
  let branchY;
  if (targetY > parentBottomY + 20) {
    branchY = parentBottomY + (targetY - parentBottomY) * 0.45;
  } else {
    branchY = Math.max(stemStartY + 30, parentBottomY + 15);
  }

  // Orthogonal T-junction path:
  // 1. Vertical stem from marriage line down to branchY
  // 2. Horizontal bus line from stemStartX to targetX
  // 3. Vertical drop line into child top handle
  const path = `M ${stemStartX} ${stemStartY} L ${stemStartX} ${branchY} L ${targetX} ${branchY} L ${targetX} ${targetY}`;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: '#0d9488',
        strokeWidth: 2,
        ...style,
      }}
      markerEnd={markerEnd}
    />
  );
}
