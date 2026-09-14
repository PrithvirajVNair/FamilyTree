import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Shield, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { ShareModal } from '../components/family/ShareModal';

export function FamilySettings() {
  const { familyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [family, setFamily] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = family?.owner_id === user?.id;

  useEffect(() => {
    async function loadFamily() {
      if (!familyId) return;
      try {
        const { data, error: famErr } = await supabase
          .from('families')
          .select('*')
          .eq('id', familyId)
          .single();

        if (famErr) throw famErr;
        setFamily(data);
        setName(data.name);
        setDescription(data.description || '');
      } catch (err) {
        setError(err.message || 'Failed to load family settings.');
      } finally {
        setLoading(false);
      }
    }
    loadFamily();
  }, [familyId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updErr } = await supabase
        .from('families')
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq('id', familyId);

      if (updErr) throw updErr;
      setSuccess('Family tree settings saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update family settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase.from('families').delete().eq('id', familyId);
      if (delErr) throw delErr;
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete family tree: ' + err.message);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar familyName={family?.name} familyId={familyId} />

      <main style={{ flex: 1, maxWidth: '760px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link to={`/family/${familyId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            <ArrowLeft size={16} />
            <span>Back to Family Tree Canvas</span>
          </Link>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Tree Settings & Sharing
          </h1>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginBottom: '20px'
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
            padding: '12px 16px',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary)',
            fontSize: '0.875rem',
            marginBottom: '20px'
          }}>
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* General Settings */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '28px'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>General Information</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Family Tree Title</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </form>
        </div>

        {/* Collaborators & Sharing */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Collaborators & Roles</h2>
            </div>
            <button onClick={() => setShareModalOpen(true)} className="btn btn-sm btn-outline">
              Manage Access
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Grant family members editor or viewer permissions with secure Row Level Security (RLS).
          </p>
        </div>

        {/* Danger Zone */}
        {isOwner && (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--danger)', marginBottom: '8px' }}>Danger Zone</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Permanently delete this entire family tree, including all records, relationships, and uploaded photos.
            </p>
            <button onClick={() => setDeleteModalOpen(true)} className="btn btn-danger">
              <Trash2 size={16} />
              <span>Delete Entire Family Tree</span>
            </button>
          </div>
        )}
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        familyId={familyId}
        isOwner={isOwner}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>Confirm Tree Deletion</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Are you sure you want to permanently delete <strong>{family?.name}</strong>? This action is irreversible.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteModalOpen(false)} className="btn btn-secondary" disabled={isDeleting}>
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-danger" disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
