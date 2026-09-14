import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export const UnionNode = memo(function UnionNode() {
  return (
    <div
      style={{
        width: 4,
        height: 4,
        position: 'relative',
        pointerEvents: 'none',
      }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          width: 4,
          height: 4,
          minWidth: 4,
          minHeight: 4,
          bottom: 0,
          left: 0,
          opacity: 0,
          border: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});
