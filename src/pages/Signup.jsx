import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitFork, AlertCircle, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';

export function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signUp({ email, password, fullName });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
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
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          padding: '36px 32px'
        }}>
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
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>Create Your Account</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Begin mapping your generational family history.
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
                <strong>Local Mode Active:</strong> Sign up works instantaneously!
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
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Eleanor Harrison"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
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
              <UserPlus size={18} />
              <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
