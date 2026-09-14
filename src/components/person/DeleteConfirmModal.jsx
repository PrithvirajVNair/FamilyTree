import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getPersonFullName } from '../../utils/relationshipUtils';

export function DeleteConfirmModal({
  isOpen,
  person,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  if (!isOpen || !person) return null;

  const fullName = getPersonFullName(person);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={20} />
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ paddingTop: '12px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Delete {fullName}?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
            This will remove <strong style={{ color: 'var(--text-primary)' }}>{fullName}</strong> from this family tree and automatically remove their parent, child, and spouse relationships.
          </p>
          <div style={{
            marginTop: '16px',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            This action cannot be undone.
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Relative'}
          </button>
        </div>
      </div>
    </div>
  );
}
