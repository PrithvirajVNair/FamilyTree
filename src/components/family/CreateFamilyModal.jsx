import React, { useState } from 'react';
import { X, GitFork, AlertCircle } from 'lucide-react';

export function CreateFamilyModal({
  isOpen,
  onClose,
  onSubmit, // ({ name, description }) => Promise
  isCreating = false,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Family name is required.');
      return;
    }
    setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create family tree.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GitFork size={18} style={{ transform: 'rotate(180deg)' }} />
            </div>
            <h3 className="modal-title">Create Family Tree</h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
              <label className="form-label">
                Family Tree Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. The Harrison Family Lineage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <span className="form-hint">E.g., your family name, paternal branch, or ancestral line.</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description (Optional)</label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="Documenting origins, migrations, and cherished family memories..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Tree'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
