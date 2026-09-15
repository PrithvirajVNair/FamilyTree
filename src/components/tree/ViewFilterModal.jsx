import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  SlidersHorizontal,
  Users,
  Check,
  Search,
  RotateCcw,
  Sparkles,
  Heart,
  GitFork,
  Compass,
} from 'lucide-react';
import { getPersonFullName, getPersonInitials, getPersonYears } from '../../utils/relationshipUtils';

export function ViewFilterModal({
  isOpen,
  onClose,
  rootPerson,
  allRelativesWithKinship = [],
  currentOptions = {},
  onApplyOptions,
}) {
  // Local working state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [ancestorsDepth, setAncestorsDepth] = useState(2);
  const [descendantsDepth, setDescendantsDepth] = useState(2);
  const [includeSpouses, setIncludeSpouses] = useState(true);
  const [includeSiblings, setIncludeSiblings] = useState(true);
  const [mode, setMode] = useState('custom'); // 'custom' | 'immediate' | 'lineage' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize initial state when modal opens
  useEffect(() => {
    if (isOpen && allRelativesWithKinship.length > 0) {
      const currentlyVisible = new Set(
        allRelativesWithKinship.filter((r) => r.isVisible).map((r) => r.person.id)
      );
      if (rootPerson?.id) {
        currentlyVisible.add(rootPerson.id);
      }
      setSelectedIds(currentlyVisible);

      setAncestorsDepth(currentOptions.ancestors ?? 2);
      setDescendantsDepth(currentOptions.descendants ?? 2);
      setIncludeSpouses(currentOptions.includeSpouses ?? true);
      setIncludeSiblings(currentOptions.includeSiblings ?? true);

      if (currentOptions.showAllConnected) {
        setMode('all');
      } else if (currentOptions.customIncludedIds) {
        setMode('custom');
      } else {
        setMode('custom');
      }
    }
  }, [isOpen, allRelativesWithKinship, currentOptions, rootPerson]);

  if (!isOpen) return null;

  const rootFullName = rootPerson ? getPersonFullName(rootPerson) : null;

  // Filter relatives list by search query
  const filteredRelatives = allRelativesWithKinship.filter(({ person, kinshipLabel }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = getPersonFullName(person).toLowerCase();
    const role = (kinshipLabel || '').toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  // Toggle individual person
  const handleTogglePerson = (personId) => {
    if (rootPerson && personId === rootPerson.id) return; // Focused root cannot be deselected in focused view
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
    setMode('custom');
  };

  // Preset Handlers
  const handleApplyPreset = (presetType) => {
    setMode(presetType);
    if (presetType === 'all') {
      const allIds = new Set(allRelativesWithKinship.map((r) => r.person.id));
      if (rootPerson) allIds.add(rootPerson.id);
      setSelectedIds(allIds);
    } else if (presetType === 'immediate' && rootPerson) {
      const immediateIds = new Set([rootPerson.id]);
      allRelativesWithKinship.forEach(({ person, kinshipLabel }) => {
        if (
          [
            'Father',
            'Mother',
            'Parent',
            'Wife',
            'Husband',
            'Spouse',
            'Son',
            'Daughter',
            'Child',
            'Brother',
            'Sister',
            'Sibling',
          ].includes(kinshipLabel)
        ) {
          immediateIds.add(person.id);
        }
      });
      setSelectedIds(immediateIds);
    } else if (presetType === 'lineage' && rootPerson) {
      const lineageIds = new Set([rootPerson.id]);
      allRelativesWithKinship.forEach(({ person, kinshipLabel }) => {
        if (
          [
            'Father',
            'Mother',
            'Parent',
            'Grandfather',
            'Grandmother',
            'Grandparent',
            'Son',
            'Daughter',
            'Child',
            'Grandson',
            'Granddaughter',
            'Grandchild',
          ].includes(kinshipLabel)
        ) {
          lineageIds.add(person.id);
        }
      });
      setSelectedIds(lineageIds);
    }
  };

  const handleSelectAll = () => {
    const all = new Set(allRelativesWithKinship.map((r) => r.person.id));
    if (rootPerson) all.add(rootPerson.id);
    setSelectedIds(all);
    setMode('custom');
  };

  const handleClear = () => {
    if (rootPerson) {
      setSelectedIds(new Set([rootPerson.id]));
    } else {
      setSelectedIds(new Set());
    }
    setMode('custom');
  };

  // Submit and apply changes
  const handleApply = () => {
    onApplyOptions({
      customIncludedIds: Array.from(selectedIds),
      ancestors: ancestorsDepth,
      descendants: descendantsDepth,
      includeSpouses,
      includeSiblings,
      showAllConnected: mode === 'all',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '94%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {rootPerson ? `Customize ${rootFullName}'s Family View` : 'Select Who Should Be There'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {rootPerson
                  ? `Select who should be rendered in this perspective (${selectedIds.size} of ${allRelativesWithKinship.length} relatives selected)`
                  : `Choose which relatives to display in the tree (${selectedIds.size} of ${allRelativesWithKinship.length} relatives selected)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* 1. Presets Bar */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Quick Presets
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {rootPerson && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('immediate')}
                    className={`btn btn-sm ${mode === 'immediate' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.82rem', gap: '6px' }}
                  >
                    <Users size={14} />
                    <span>Immediate Family</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('lineage')}
                    className={`btn btn-sm ${mode === 'lineage' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.82rem', gap: '6px' }}
                  >
                    <GitFork size={14} />
                    <span>Direct Lineage</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => handleApplyPreset('all')}
                className={`btn btn-sm ${mode === 'all' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.82rem', gap: '6px' }}
              >
                <Sparkles size={14} />
                <span>All Relatives</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`btn btn-sm ${mode === 'custom' ? 'btn-secondary' : 'btn-outline'}`}
                style={{ fontSize: '0.82rem', gap: '6px' }}
              >
                <SlidersHorizontal size={14} />
                <span>Custom Selection</span>
              </button>
            </div>
          </div>

          {/* 2. Search & Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search relatives by name or relationship..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '34px',
                  paddingRight: '12px',
                  height: '36px',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.78rem', color: 'var(--primary)', padding: '5px 8px' }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '5px 8px' }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* 3. Relatives Checklist */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              maxHeight: '340px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            {filteredRelatives.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No relatives match &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredRelatives.map(({ person, kinshipLabel, isRoot }) => {
                const isSelected = selectedIds.has(person.id);
                const genderClass = (person.gender || '').toLowerCase();
                const initials = getPersonInitials(person);
                const years = getPersonYears(person);

                return (
                  <div
                    key={person.id}
                    onClick={() => handleTogglePerson(person.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: isRoot
                        ? 'var(--primary-light)'
                        : isSelected
                        ? 'rgba(15, 118, 110, 0.04)'
                        : 'transparent',
                      cursor: isRoot ? 'default' : 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Left: Checkbox & Person Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isRoot}
                        onChange={() => handleTogglePerson(person.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: 'var(--primary)',
                          cursor: isRoot ? 'not-allowed' : 'pointer',
                        }}
                      />

                      {/* Avatar */}
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: genderClass === 'female' ? '#fdf2f8' : genderClass === 'male' ? '#eff6ff' : 'var(--bg-subtle)',
                          color: genderClass === 'female' ? '#db2777' : genderClass === 'male' ? '#2563eb' : 'var(--text-secondary)',
                          border: `1.5px solid ${genderClass === 'female' ? '#fbcfe8' : genderClass === 'male' ? '#bfdbfe' : 'var(--border-color)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>

                      {/* Name & Years */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {getPersonFullName(person)}
                        </div>
                        {years && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {years}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Kinship Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isRoot ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            backgroundColor: 'white',
                            border: '1px solid var(--primary-border)',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Compass size={12} />
                          <span>Focused Person</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {kinshipLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (rootPerson) {
                handleApplyPreset('immediate');
              } else {
                handleSelectAll();
              }
            }}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', gap: '5px' }}
          >
            <RotateCcw size={14} />
            <span>Reset to Default</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 18px', gap: '6px' }}
            >
              <Check size={16} />
              <span>Apply View ({selectedIds.size} Visible)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
