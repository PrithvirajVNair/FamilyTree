import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GitFork, Users, Plus, LogOut, User, Settings, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPersonInitials } from '../../utils/relationshipUtils';

export function Navbar({ familyName = null, familyId = null }) {
  const { user, profile, signOut, isConfigured } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  return (
    <header className="site-navbar" style={{
      height: '64px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <GitFork size={20} style={{ transform: 'rotate(180deg)' }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}>
            Kith & Kin
          </span>
        </Link>

        {familyName && familyId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
            <span style={{ color: 'var(--border-hover)' }}>/</span>
            <span style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {familyName}
            </span>
          </div>
        )}
      </div>

      {/* Right Action Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {!isConfigured && (
          <div
            title="Running in local storage fallback mode. Add Supabase keys to .env to connect to live Supabase."
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-amber-light)',
              color: 'var(--accent-amber)',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid var(--accent-amber-border)'
            }}
          >
            <Sparkles size={13} />
            <span>Local Dev Mode</span>
          </div>
        )}

        {user ? (
          <>
            <Link to="/dashboard" className={`btn btn-sm ${location.pathname === '/dashboard' ? 'btn-secondary' : 'btn-ghost'}`}>
              <Users size={16} />
              <span>My Trees</span>
            </Link>

            {familyId && (
              <Link to={`/family/${familyId}/settings`} className="btn btn-sm btn-ghost" title="Family Tree Settings">
                <Settings size={16} />
              </Link>
            )}

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1.5px solid var(--primary-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }}
                    />
                  ) : (
                    getPersonInitials({ first_name: profile?.display_name || user.email })
                  )}
                </div>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '220px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  zIndex: 200,
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile?.display_name || 'Family Historian'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <User size={16} />
                    <span>Profile Account</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.875rem',
                      color: 'var(--danger)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/login" className="btn btn-sm btn-ghost">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-sm btn-primary">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
