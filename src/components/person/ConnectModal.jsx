import React, { useState } from 'react';
import { X, Link2, AlertCircle } from 'lucide-react';
import { getPersonFullName, validateNewRelationship } from '../../utils/relationshipUtils';

export function ConnectModal({
  isOpen,
  onClose,
  people = [],
  relationships = [],
  onConnect,
  isSaving = false,
}) {
  const [person1Id, setPerson1Id] = useState(people[0]?.id || '');
  const [person2Id, setPerson2Id] = useState(people[1]?.id || '');
  const [relType, setRelType] = useState('parent');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const check = validateNewRelationship(person1Id, person2Id, relType, relationships);
    if (!check.valid) {
      setError(check.message);
      return;
    }

    try {
      await onConnect(person1Id, person2Id, relType);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to connect relatives.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={18} color="var(--primary)" />
            <span>Connect Relatives</span>
          </h3>
          <button onClick={onClose} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Link two existing members in this family tree as a parent-child or spousal union.
            </p>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'var(--danger-light)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontSize: '0.875rem',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">First Relative</label>
              <select
                className="form-select"
                value={person1Id}
                onChange={(e) => setPerson1Id(e.target.value)}
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getPersonFullName(p)} ({p.gender || 'Person'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Relationship Connection</label>
              <select
                className="form-select"
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
              >
                <option value="parent">is Parent of &rarr;</option>
                <option value="spouse">&harr; is Spouse / Partner of</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Second Relative</label>
              <select
                className="form-select"
                value={person2Id}
                onChange={(e) => setPerson2Id(e.target.value)}
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === person1Id}>
                    {getPersonFullName(p)} ({p.gender || 'Person'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Connecting...' : 'Establish Relationship'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
