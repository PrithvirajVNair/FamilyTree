import React from 'react';
import { ArrowLeft, Compass, RotateCcw, Users, SlidersHorizontal } from 'lucide-react';
import { getPersonFullName } from '../../utils/relationshipUtils';

export function TreeBreadcrumb({
  rootPerson,
  familyName,
  onNavigateBack,
  canGoBack = false,
  onResetToFullTree,
  onOpenFilterModal,
  totalPeopleCount = 0,
  visiblePeopleCount = 0,
  isFiltered = false,
}) {
  const rootName = rootPerson ? getPersonFullName(rootPerson) : null;
  const isFullTree = !rootPerson;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 20px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-light)',
        fontSize: '0.875rem',
        flexWrap: 'wrap',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Back Button */}
        {canGoBack && (
          <button
            onClick={onNavigateBack}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--primary)',
            }}
            title="Return to previous perspective"
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>
        )}

        {/* Perspective Context Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: isFullTree ? 'rgba(15, 118, 110, 0.08)' : 'var(--bg-subtle)',
              border: isFullTree ? '1px solid var(--primary-border)' : '1px solid var(--border-color)',
              color: isFullTree ? 'var(--primary-dark, #0f766e)' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.82rem',
            }}
          >
            {isFullTree ? (
              <>
                <Users size={14} color="var(--primary)" />
                <span>{familyName ? `${familyName} (Full Tree)` : 'Full Family Tree'}</span>
              </>
            ) : (
              <>
                <Compass size={14} color="var(--primary)" />
                <span>Focus: {rootName}&apos;s Lineage</span>
              </>
            )}
          </div>

          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Users size={12} />
            <span>
              {isFiltered
                ? `Showing ${visiblePeopleCount} of ${totalPeopleCount} relatives`
                : `All ${totalPeopleCount} relatives`}
            </span>
          </span>
        </div>

        {/* Customize / Select Who Should Be There Button */}
        {onOpenFilterModal && (
          <button
            onClick={onOpenFilterModal}
            className="btn btn-outline btn-sm"
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isFiltered ? 'var(--primary-light)' : 'transparent',
              borderColor: isFiltered ? 'var(--primary-border)' : 'var(--border-color)',
              color: isFiltered ? 'var(--primary)' : 'var(--text-primary)',
            }}
            title="Choose which relatives to include in this tree view"
          >
            <SlidersHorizontal size={13} />
            <span>Select Who Should Be There</span>
          </button>
        )}
      </div>

      {/* Right Action: Return to Full Family Tree if focused or filtered */}
      {(!isFullTree || isFiltered) && onResetToFullTree && (
        <button
          onClick={onResetToFullTree}
          className="btn btn-ghost btn-sm"
          style={{
            fontSize: '0.78rem',
            color: 'var(--primary)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--primary-border)',
            backgroundColor: 'var(--primary-light)',
          }}
          title="Return to the complete unrooted family tree"
        >
          <RotateCcw size={13} />
          <span>View Full Tree</span>
        </button>
      )}
    </div>
  );
}
