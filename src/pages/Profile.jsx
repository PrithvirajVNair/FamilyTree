import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Save, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { getPersonInitials } from '../utils/relationshipUtils';

export function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await updateProfile({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '600px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
          Account Settings
        </h1>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: '28px 24px',
          marginBottom: '24px'
        }}>
          {/* Profile Header preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 700,
              border: '2px solid var(--primary-border)',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getPersonInitials({ first_name: displayName || user?.email })
              )}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {displayName || 'Genealogist'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {user?.email}
              </div>
            </div>
          </div>

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
              marginBottom: '20px'
            }}>
              <Check size={16} />
              <span>Profile updated successfully!</span>
            </div>
          )}

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
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Image URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Managed by Supabase Auth)</label>
              <input
                type="text"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ backgroundColor: 'var(--bg-subtle)', cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sign Out Card */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Account Session</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sign out on this browser</div>
          </div>
          <button onClick={handleSignOut} className="btn btn-outline" style={{ color: 'var(--danger)' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </main>
    </div>
  );
}
