import React from 'react';
import { BaseEdge, getStraightPath } from '@xyflow/react';

export function SpouseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: '#cbd5e1',
        strokeWidth: 2,
        ...style,
      }}
      markerEnd={markerEnd}
    />
  );
}

