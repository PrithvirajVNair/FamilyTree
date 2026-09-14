import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GitFork, AlertCircle, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await signIn({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          padding: '36px 32px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <GitFork size={24} style={{ transform: 'rotate(180deg)' }} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Sign in to manage and view your family trees.
            </p>
          </div>

          {!isConfigured && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--accent-amber-light)',
              border: '1px solid var(--accent-amber-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-amber)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Local Demo Mode Active:</strong> You can enter any email & password to sign in immediately!
              </div>
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
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              <LogIn size={18} />
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account yet?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
