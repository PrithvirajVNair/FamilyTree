import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PersonNode } from './PersonNode';
import { SpouseEdge } from './SpouseEdge';
import { FamilyBranchEdge } from './FamilyBranchEdge';
import { buildFamilyTreeLayout } from '../../utils/familyTreeLayout';
import { getPersonFullName, validateNewRelationship } from '../../utils/relationshipUtils';
import { Users, Plus, Sparkles, Heart, UserCheck, Baby, X, AlertCircle } from 'lucide-react';

const nodeTypes = {
  personNode: PersonNode,
};

const edgeTypes = {
  spouseEdge: SpouseEdge,
  familyBranchEdge: FamilyBranchEdge,
};

export function TreeCanvasInner({
  people = [],
  relationships = [],
  selectedPerson = null,
  highlightedPersonId = null,
  onSelectPerson,
  onOpenAddModal,
  onLoadDemo,
  onAddRelationship,
  showMinimap = true,
  canEdit = true,
  fitViewRef,
  resetLayoutRef,
}) {
  const reactFlow = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [connectionPrompt, setConnectionPrompt] = useState(null);
  const [connectError, setConnectError] = useState(null);

  // Preserve user-dragged node coordinates across selections and updates
  const customPositionsRef = useRef({});

  // Reset auto-layout function exposed to toolbar
  const handleResetLayout = useCallback(() => {
    customPositionsRef.current = {};
    if (!people || people.length === 0) return;

    const { nodes: layoutNodes, edges: layoutEdges } = buildFamilyTreeLayout(people, relationships);
    const enrichedNodes = layoutNodes.map((n) => ({
      ...n,
      selected: selectedPerson?.id === n.id,
      data: {
        ...n.data,
        onSelectPerson,
        highlightedPersonId,
      },
    }));

    setNodes(enrichedNodes);
    setEdges(layoutEdges);
    setTimeout(() => {
      reactFlow.fitView({ padding: 0.25, duration: 500 });
    }, 50);
  }, [people, relationships, selectedPerson, highlightedPersonId, onSelectPerson, reactFlow, setNodes, setEdges]);

  useEffect(() => {
    if (resetLayoutRef) {
      resetLayoutRef.current = handleResetLayout;
    }
  }, [resetLayoutRef, handleResetLayout]);

  // Track position changes when user drags nodes
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          customPositionsRef.current[change.id] = change.position;
        }
      });
    },
    [onNodesChange]
  );

  // Compute layout when people or relationships change, respecting manual positions
  useEffect(() => {
    if (!people || people.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutNodes, edges: layoutEdges } = buildFamilyTreeLayout(people, relationships);

    // Apply saved custom positions if user previously dragged the node
    const enrichedNodes = layoutNodes.map((n) => {
      const customPos = customPositionsRef.current[n.id];
      return {
        ...n,
        position: customPos || n.position,
        selected: selectedPerson?.id === n.id,
        data: {
          ...n.data,
          onSelectPerson,
          highlightedPersonId,
        },
      };
    });


    setNodes(enrichedNodes);
    setEdges(layoutEdges);

    // Only auto-fit if this is the very first render or empty tree
    if (Object.keys(customPositionsRef.current).length === 0) {
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.25, duration: 400 });
      }, 50);
    }
  }, [people, relationships, selectedPerson, highlightedPersonId, onSelectPerson]);


  // Expose fitView method to parent toolbar
  useEffect(() => {
    if (fitViewRef) {
      fitViewRef.current = () => {
        reactFlow.fitView({ padding: 0.25, duration: 500 });
      };
    }
  }, [fitViewRef, reactFlow]);

  // Focus and center canvas when a person is highlighted (e.g. from search)
  useEffect(() => {
    if (highlightedPersonId) {
      const node = nodes.find((n) => n.id === highlightedPersonId);
      if (node) {
        reactFlow.setCenter(node.position.x + 110, node.position.y + 55, {
          zoom: 1.2,
          duration: 700,
        });
      }
    }
  }, [highlightedPersonId, nodes, reactFlow]);

  // Handle interactive drag-and-drop connection between nodes!
  const handleConnect = useCallback(
    (connection) => {
      if (!canEdit || !connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const p1 = people.find((p) => p.id === connection.source);
      const p2 = people.find((p) => p.id === connection.target);
      if (!p1 || !p2) return;

      // Smart guess of default relationship type based on handle IDs
      let defaultType = 'parent';
      const sHandle = (connection.sourceHandle || '').toLowerCase();
      const tHandle = (connection.targetHandle || '').toLowerCase();

      if (sHandle.includes('left') || sHandle.includes('right') || tHandle.includes('left') || tHandle.includes('right')) {
        defaultType = 'spouse';
      } else if (sHandle.includes('top') || tHandle.includes('bottom')) {
        // Dragged from top of source (child) to bottom of target (parent)
        defaultType = 'child';
      }

      setConnectionPrompt({
        sourcePerson: p1,
        targetPerson: p2,
        defaultType,
      });
      setConnectError(null);
    },
    [canEdit, people]
  );

  // Confirm connection from the drag-and-drop quick prompt
  const handleConfirmConnection = async (type) => {
    if (!connectionPrompt || !onAddRelationship) return;
    const { sourcePerson, targetPerson } = connectionPrompt;

    let p1Id = sourcePerson.id;
    let p2Id = targetPerson.id;
    let relType = type;

    if (type === 'parent') {
      p1Id = sourcePerson.id;
      p2Id = targetPerson.id;
    } else if (type === 'child') {
      p1Id = targetPerson.id;
      p2Id = sourcePerson.id;
      relType = 'parent';
    }

    const check = validateNewRelationship(p1Id, p2Id, relType, relationships);
    if (!check.valid) {
      setConnectError(check.message);
      return;
    }

    try {
      await onAddRelationship(p1Id, p2Id, relType);
      setConnectionPrompt(null);
      setConnectError(null);
    } catch (err) {
      setConnectError(err.message || 'Failed to establish relationship.');
    }
  };

  const handleNodeClick = useCallback(
    (_, node) => {
      const person = people.find((p) => p.id === node.id);
      if (person && onSelectPerson) {
        onSelectPerson(person);
      }
    },
    [people, onSelectPerson]
  );

  const handlePaneClick = useCallback(() => {
    if (onSelectPerson) {
      onSelectPerson(null);
    }
  }, [onSelectPerson]);

  // Mini-map node color mapping
  const nodeColor = useCallback((node) => {
    const gender = node.data?.person?.gender;
    if (gender === 'Male') return '#0284c7';
    if (gender === 'Female') return '#db2777';
    if (gender === 'Other') return '#7c3aed';
    return '#78716c';
  }, []);

  if (people.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-page)',
        padding: '32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          marginBottom: '20px',
          border: '1.5px dashed var(--border-hover)',
        }}>
          <Users size={34} />
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
          Start Your Family Tree
        </h2>
        <p style={{
          maxWidth: '440px',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: '24px',
        }}>
          Document your family lineage across generations. Add your first relative, or explore a 3-generation sample tree.
        </p>

        {canEdit && (
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={onOpenAddModal} className="btn btn-primary btn-lg">
              <Plus size={18} />
              <span>Add First Person</span>
            </button>
            <button
              onClick={onLoadDemo}
              className="btn btn-lg"
              style={{
                backgroundColor: 'var(--accent-amber-light)',
                color: 'var(--accent-amber)',
                borderColor: 'var(--accent-amber-border)',
              }}
            >
              <Sparkles size={18} />
              <span>Load Sample Family Tree</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const selectedCount = nodes.filter((n) => n.selected).length;


  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Floating Multi-Selection Indicator */}
      {selectedCount > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            padding: '6px 18px',
            borderRadius: '9999px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          <span>{selectedCount} people selected • Drag any to move together</span>
        </div>
      )}

      {/* Subtle Navigation Hint Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-light)',
          padding: '5px 14px',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <span><strong>Left Click</strong>: Select &amp; Box-Select</span>
        <span>•</span>
        <span><strong>Drag</strong>: Move Selected</span>
        <span>•</span>
        <span><strong>Right Click / Middle Mouse</strong>: Pan Canvas</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={(e) => e.preventDefault()}
        panOnDrag={[1, 2]}
        selectionOnDrag={canEdit}
        selectionMode="partial"
        selectNodesOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={true}
        multiSelectionKeyCode={['Control', 'Shift', 'Meta']}
        connectionMode="loose"
        connectionRadius={35}
        connectionLineType="smoothstep"
        connectionLineStyle={{
          stroke: '#94a3b8',
          strokeWidth: 2,
          strokeDasharray: '4,4',
        }}
        nodesDraggable={canEdit}
        nodesConnectable={canEdit}
        elementsSelectable={canEdit}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={24} size={1.5} />
        <Controls showInteractive={false} position="bottom-left" />
        {showMinimap && (
          <MiniMap
            nodeColor={nodeColor}
            nodeStrokeWidth={2}
            position="bottom-right"
            zoomable
            pannable
            style={{ height: 110, width: 170 }}
          />
        )}
      </ReactFlow>


      {/* Quick Connect Dropdown / Dialog when user drags a line between two nodes */}
      {connectionPrompt && (
        <div className="modal-backdrop" onClick={() => setConnectionPrompt(null)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Establish Relationship</h3>
              <button
                onClick={() => setConnectionPrompt(null)}
                className="btn-ghost"
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                How are <strong>{getPersonFullName(connectionPrompt.sourcePerson)}</strong> and{' '}
                <strong>{getPersonFullName(connectionPrompt.targetPerson)}</strong> related?
              </p>

              {connectError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--danger-light)',
                    border: '1px solid var(--danger-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{connectError}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleConfirmConnection('parent')}
                  className="btn btn-outline"
                  style={{ justifyContent: 'flex-start', padding: '12px 14px', textAlign: 'left' }}
                >
                  <UserCheck size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {getPersonFullName(connectionPrompt.sourcePerson)} is Parent of{' '}
                      {getPersonFullName(connectionPrompt.targetPerson)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Parent &rarr; Child connection
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmConnection('child')}
                  className="btn btn-outline"
                  style={{ justifyContent: 'flex-start', padding: '12px 14px', textAlign: 'left' }}
                >
                  <Baby size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {getPersonFullName(connectionPrompt.targetPerson)} is Parent of{' '}
                      {getPersonFullName(connectionPrompt.sourcePerson)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Child &larr; Parent connection
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmConnection('spouse')}
                  className="btn btn-outline"
                  style={{ justifyContent: 'flex-start', padding: '12px 14px', textAlign: 'left' }}
                >
                  <Heart size={18} color="#d97706" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      Spouses / Partners
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Horizontal spousal union
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setConnectionPrompt(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
