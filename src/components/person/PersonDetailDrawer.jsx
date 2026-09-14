import React from 'react';
import {
  X,
  Edit2,
  Trash2,
  Plus,
  Heart,
  Baby,
  Users,
  MapPin,
  Calendar,
  FileText,
  UserCheck,
  Compass,
  CheckCircle2,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import {
  getPersonFullName,
  getPersonYears,
  getPersonInitials,
  getParentIds,
  getChildIds,
  getSpouseIds,
  getSiblingIds,
} from '../../utils/relationshipUtils';

export function PersonDetailDrawer({
  person,
  allPeople = [],
  relationships = [],
  rootPersonId = null,
  onExploreFamily,
  onOpenFilterModal,
  onClose,
  onEdit,
  onDelete,
  onAddRelative, // ({ targetPersonId, relationType })
  onAddRelationship,
  onDeleteRelationship,
  onSelectPerson,
  canEdit = true,
}) {

  if (!person) return null;

  const fullName = getPersonFullName(person);
  const years = getPersonYears(person);
  const initials = getPersonInitials(person);
  const genderClass = (person.gender || 'unknown').toLowerCase();

  // Find relative objects
  const parentIds = getParentIds(person.id, relationships);
  const childIds = getChildIds(person.id, relationships);
  const spouseIds = getSpouseIds(person.id, relationships);
  const siblingIds = getSiblingIds(person.id, relationships);

  const parents = allPeople.filter((p) => parentIds.includes(p.id));
  const children = allPeople.filter((p) => childIds.includes(p.id));
  const spouses = allPeople.filter((p) => spouseIds.includes(p.id));
  const siblings = allPeople.filter((p) => siblingIds.includes(p.id));

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-content">
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface-hover)'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Person Profile
          </span>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          {/* Main Hero Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            {person.photo_url ? (
              <img
                src={person.photo_url}
                alt={fullName}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--border-light)',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: '14px'
                }}
              />
            ) : (
              <div
                className={`person-node-avatar ${genderClass}`}
                style={{
                  width: '88px',
                  height: '88px',
                  fontSize: '2rem',
                  marginBottom: '14px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {initials}
              </div>
            )}

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {fullName}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className={`badge badge-${genderClass}`}>
                {person.gender || 'Unknown'}
              </span>
              {years && (
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {years}
                </span>
              )}
            </div>

            {person.birth_place && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <MapPin size={14} />
                <span>{person.birth_place}</span>
              </div>
            )}
          </div>

          {/* Explore Family Perspective Action */}
          {onExploreFamily && (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {person.id === rootPersonId ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      padding: '9px 14px',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      border: '1px solid var(--primary-border)',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Currently Centered on {person.first_name || fullName}</span>
                  </div>

                  {onOpenFilterModal && (
                    <button
                      type="button"
                      onClick={() => onOpenFilterModal(person.id)}
                      className="btn btn-outline"
                      style={{
                        width: '100%',
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        fontWeight: 600,
                      }}
                    >
                      <SlidersHorizontal size={15} />
                      <span>Select Who Should Be There</span>
                    </button>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onExploreFamily(person.id, false)}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      boxShadow: '0 2px 10px rgba(15, 118, 110, 0.25)',
                    }}
                    title={`Center the family tree around ${person.first_name || fullName}`}
                  >
                    <Compass size={16} />
                    <span>Explore {person.first_name || fullName}&apos;s Family</span>
                  </button>

                  {onOpenFilterModal && (
                    <button
                      type="button"
                      onClick={() => onExploreFamily(person.id, true)}
                      className="btn btn-outline"
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Select who should be included in this view before exploring"
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Action Buttons for editing/deleting */}
          {canEdit && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>

              <button
                onClick={() => onEdit(person)}
                className="btn btn-outline"
                style={{ flex: 1, padding: '8px 12px' }}
              >
                <Edit2 size={15} />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => onDelete(person)}
                className="btn btn-ghost"
                style={{ color: 'var(--danger)', padding: '8px 12px' }}
                title="Delete Person"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* Life Details */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '24px',
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Date of Birth</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {person.birth_date || 'Unknown'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Date of Death</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {person.death_date || 'Living'}
                </span>
              </div>
            </div>

            {person.notes && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>
                  Biographical Notes
                </span>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {person.notes}
                </p>
              </div>
            )}
          </div>

          {/* Family Connections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Parents */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} color="var(--primary)" />
                  <span>Parents ({parents.length})</span>
                </span>
                {canEdit && (
                  <button
                    onClick={() => onAddRelative({ targetPersonId: person.id, relationType: 'parent' })}
                    className="btn btn-sm btn-ghost"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                  >
                    <Plus size={13} />
                    <span>Add Parent</span>
                  </button>
                )}
              </div>

              {parents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {parents.map((p) => {
                    const rel = relationships.find((r) => r.relationship_type === 'parent' && r.person_1_id === p.id && r.person_2_id === person.id);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)'
                        }}
                        onClick={() => onSelectPerson(p)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getPersonFullName(p)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{getPersonYears(p)}</span>
                        </div>
                        {canEdit && rel && onDeleteRelationship && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {onAddRelationship && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await onDeleteRelationship(rel.id);
                                  await onAddRelationship(person.id, p.id, 'parent');
                                }}
                                className="btn-ghost"
                                style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                title="Swap parent/child direction (make this person parent instead)"
                              >
                                <ArrowUpDown size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRelationship(rel.id);
                              }}
                              className="btn-ghost"
                              style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Unlink parent relationship"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                  No parents recorded yet.
                </div>
              )}
            </div>

            {/* Spouses / Partners */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={14} color="var(--accent-amber)" />
                  <span>Spouse / Partners ({spouses.length})</span>
                </span>
                {canEdit && (
                  <button
                    onClick={() => onAddRelative({ targetPersonId: person.id, relationType: 'spouse' })}
                    className="btn btn-sm btn-ghost"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                  >
                    <Plus size={13} />
                    <span>Add Spouse</span>
                  </button>
                )}
              </div>

              {spouses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {spouses.map((p) => {
                    const rel = relationships.find(
                      (r) =>
                        r.relationship_type === 'spouse' &&
                        ((r.person_1_id === p.id && r.person_2_id === person.id) ||
                          (r.person_1_id === person.id && r.person_2_id === p.id))
                    );
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)'
                        }}
                        onClick={() => onSelectPerson(p)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getPersonFullName(p)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{getPersonYears(p)}</span>
                        </div>
                        {canEdit && rel && onDeleteRelationship && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRelationship(rel.id);
                            }}
                            className="btn-ghost"
                            style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="Unlink spouse relationship"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                  No spouses/partners recorded yet.
                </div>
              )}
            </div>

            {/* Children */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Baby size={15} color="var(--primary)" />
                  <span>Children ({children.length})</span>
                </span>
                {canEdit && (
                  <button
                    onClick={() => onAddRelative({ targetPersonId: person.id, relationType: 'child' })}
                    className="btn btn-sm btn-ghost"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                  >
                    <Plus size={13} />
                    <span>Add Child</span>
                  </button>
                )}
              </div>

              {children.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {children.map((p) => {
                    const rel = relationships.find((r) => r.relationship_type === 'parent' && r.person_1_id === person.id && r.person_2_id === p.id);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)'
                        }}
                        onClick={() => onSelectPerson(p)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getPersonFullName(p)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{getPersonYears(p)}</span>
                        </div>
                        {canEdit && rel && onDeleteRelationship && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {onAddRelationship && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await onDeleteRelationship(rel.id);
                                  await onAddRelationship(p.id, person.id, 'parent');
                                }}
                                className="btn-ghost"
                                style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                title="Swap parent/child direction (make other person parent instead)"
                              >
                                <ArrowUpDown size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRelationship(rel.id);
                              }}
                              className="btn-ghost"
                              style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Unlink child relationship"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                  No children recorded yet.
                </div>
              )}
            </div>

            {/* Siblings (Derived) */}
            {siblings.length > 0 && (
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  Siblings ({siblings.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {siblings.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelectPerson(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getPersonFullName(p)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getPersonYears(p)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
