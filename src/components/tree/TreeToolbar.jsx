import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Link2, Maximize2, MapPin, Sparkles, X, Users, LayoutGrid } from 'lucide-react';
import { getPersonFullName, getPersonYears } from '../../utils/relationshipUtils';

export function TreeToolbar({
  people = [],
  onSelectPerson,
  onOpenAddModal,
  onOpenConnectModal,
  onLoadDemo,
  onFitView,
  onResetLayout,
  showMinimap,
  onToggleMinimap,
  canEdit = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // Filter people matching search query
  const filteredPeople = searchQuery.trim()
    ? people.filter((p) => {
        const query = searchQuery.toLowerCase();
        const fullName = getPersonFullName(p).toLowerCase();
        const birthPlace = (p.birth_place || '').toLowerCase();
        return fullName.includes(query) || birthPlace.includes(query);
      })
    : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (person) => {
    onSelectPerson(person);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="tree-toolbar">
      {/* Left: Search Box */}
      <div className="search-box-wrapper" ref={searchRef}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search relatives..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            style={{
              paddingLeft: '36px',
              paddingRight: searchQuery ? '32px' : '14px',
              height: '38px',
              fontSize: '0.875rem',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsDropdownOpen(false);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="search-dropdown">
            {filteredPeople.length > 0 ? (
              filteredPeople.map((person) => (
                <div
                  key={person.id}
                  className="search-result-item"
                  onClick={() => handleSelectResult(person)}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      border: '1px solid var(--border-color)',
                      flexShrink: 0,
                    }}
                  >
                    {(person.first_name || '?')[0]}
                  </div>
                  <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getPersonFullName(person)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {getPersonYears(person) || person.gender || 'Person'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No relatives found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: People count badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="badge badge-primary" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
          <Users size={13} />
          <span>{people.length} {people.length === 1 ? 'Person' : 'People'}</span>
        </span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {people.length === 0 && canEdit && (
          <button
            onClick={onLoadDemo}
            className="btn btn-sm"
            style={{
              backgroundColor: 'var(--accent-amber-light)',
              color: 'var(--accent-amber)',
              borderColor: 'var(--accent-amber-border)',
            }}
          >
            <Sparkles size={15} />
            <span>Load Demo Tree</span>
          </button>
        )}

        {canEdit && (
          <>
            <button
              onClick={onOpenConnectModal}
              className="btn btn-sm btn-outline"
              disabled={people.length < 2}
              title="Connect two existing relatives"
            >
              <Link2 size={15} />
              <span>Connect</span>
            </button>

            <button onClick={onOpenAddModal} className="btn btn-sm btn-primary">
              <Plus size={16} />
              <span>Add Person</span>
            </button>
          </>
        )}

        <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        {/* Auto Align Layout Button */}
        <button
          onClick={onResetLayout}
          className="btn btn-sm btn-outline"
          title="Reset and auto-arrange all generations cleanly"
          disabled={people.length === 0}
        >
          <LayoutGrid size={15} />
          <span>Auto Align</span>
        </button>

        <button
          onClick={onFitView}
          className="btn btn-sm btn-ghost btn-icon"
          title="Fit view to screen"
        >
          <Maximize2 size={16} />
        </button>

        <button
          onClick={onToggleMinimap}
          className={`btn btn-sm btn-icon ${showMinimap ? 'btn-secondary' : 'btn-ghost'}`}
          title="Toggle Mini-map"
        >
          <MapPin size={16} />
        </button>
      </div>
    </div>
  );
}
