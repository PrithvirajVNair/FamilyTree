import React from 'react';
import { ArrowLeft, Compass, RotateCcw, Users, SlidersHorizontal } from 'lucide-react';
import { getPersonFullName } from '../../utils/relationshipUtils';

export function TreeBreadcrumb({
  rootPerson,
  onNavigateBack,
  canGoBack = false,
  onResetToMain,
  onOpenFilterModal,
  totalPeopleCount = 0,
  visiblePeopleCount = 0,
  isFiltered = false,
}) {
  if (!rootPerson) return null;

  const rootName = getPersonFullName(rootPerson);

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
            title="Return to previous family perspective"
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>
        )}

        {/* Current Perspective Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.82rem',
            }}
          >
            <Compass size={14} color="var(--primary)" />
            <span>{rootName}&apos;s Family</span>
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
              Showing {visiblePeopleCount} of {totalPeopleCount} relatives
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

      {/* Right Action: Reset to Main Family View if filtered */}
      {isFiltered && onResetToMain && (
        <button
          onClick={onResetToMain}
          className="btn btn-ghost btn-sm"
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Reset to the default family view"
        >
          <RotateCcw size={13} />
          <span>Reset View</span>
        </button>
      )}
    </div>
  );
}
