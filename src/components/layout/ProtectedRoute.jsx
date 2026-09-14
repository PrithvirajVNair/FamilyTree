import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: '16px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading family records...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
