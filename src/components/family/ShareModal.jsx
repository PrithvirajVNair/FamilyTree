import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Trash2, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function ShareModal({
  isOpen,
  onClose,
  familyId,
  isOwner = false,
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchCollaborators = async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('family_collaborators')
        .select('*')
        .eq('family_id', familyId);

      if (fetchErr) throw fetchErr;
      setCollaborators(data || []);
    } catch (e) {
      console.warn('Notice loading collaborators:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, familyId]);

  if (!isOpen) return null;

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // In Supabase, if sharing by email or user ID:
      const payload = {
        family_id: familyId,
        user_id: email.trim(), // Supports User ID or email identifier
        role,
      };

      const { data, error: insertErr } = await supabase
        .from('family_collaborators')
        .insert(payload)
        .select()
        .single();

      if (insertErr) throw insertErr;

      setSuccess(`Collaborator granted ${role} access.`);
      setEmail('');
      setCollaborators((prev) => [...prev, data]);
    } catch (err) {
      setError(err.message || 'Failed to add collaborator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (collabId) => {
    try {
      await supabase.from('family_collaborators').delete().eq('id', collabId);
      setCollaborators((prev) => prev.filter((c) => c.id !== collabId));
    } catch (err) {
      setError('Failed to revoke collaborator.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--primary)" />
            <h3 className="modal-title">Family Tree Sharing & Roles</h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Invite other genealogists or family members to view or co-edit this family tree.
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

          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary)',
              fontSize: '0.875rem',
              marginBottom: '16px'
            }}>
              <Check size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Add form */}
          {isOwner && (
            <form onSubmit={handleAddCollaborator} style={{ marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Collaborator Email or User ID</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="user@example.com or user-id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <select
                    className="form-select"
                    style={{ width: '130px' }}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={submitting || !email.trim()}
              >
                <UserPlus size={15} />
                <span>{submitting ? 'Adding...' : 'Invite Collaborator'}</span>
              </button>
            </form>
          )}

          {/* Collaborator List */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Current Collaborators ({collaborators.length})
            </div>

            {loading ? (
              <div style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : collaborators.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.user_id}</div>
                      <span className="badge badge-primary" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                        {c.role}
                      </span>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--danger)', padding: '6px' }}
                        title="Revoke access"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Only you have access to this family tree.
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
