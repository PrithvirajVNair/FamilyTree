import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitFork, AlertCircle, Check, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
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
              <Mail size={22} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>Reset Password</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Enter your registered email to receive recovery instructions.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                marginBottom: '16px'
              }}>
                <Check size={24} />
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                We have sent password recovery instructions to <strong>{email}</strong>. Please check your inbox.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={loading}
              >
                <span>{loading ? 'Sending link...' : 'Send Recovery Email'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <ArrowLeft size={14} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
