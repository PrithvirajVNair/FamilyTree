import React from 'react';
import { Link } from 'react-router-dom';
import { GitFork, Users, ShieldCheck, Heart, Sparkles, ArrowRight, Share2, Search, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';

export function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar />

      {/* Hero Section */}
      <main style={{ flex: 1 }}>
        <section style={{
          padding: '80px 24px 60px',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '24px',
            border: '1px solid var(--primary-border)'
          }}>
            <Sparkles size={15} />
            <span>Interactive Lineage & Heritage Visualization</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            maxWidth: '840px',
            margin: '0 auto 20px',
            lineHeight: 1.15
          }}>
            Honor your roots. Build your family’s living story.
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            A thoughtful, modern family tree builder. Map generations, cherish biographical memories, upload portraits, and collaborate with your relatives.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg" style={{ boxShadow: 'var(--shadow-md)' }}>
              <span>{user ? 'Open Your Family Trees' : 'Create Your Family Tree'}</span>
              <ArrowRight size={18} />
            </Link>
            {!user && (
              <Link to="/login" className="btn btn-outline btn-lg">
                <span>Sign In to Account</span>
              </Link>
            )}
          </div>

          {/* Interactive Visual Preview Mockup */}
          <div style={{
            marginTop: '60px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            position: 'relative',
            padding: '32px 20px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '16px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  The Harrison Family Tree (Sample Canvas)
                </span>
              </div>
              <span className="badge badge-primary">Interactive Preview</span>
            </div>

            {/* Tree Mockup Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px' }}>
              {/* Generation 0 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div className="person-node" style={{ pointerEvents: 'none' }}>
                  <div className="person-node-inner">
                    <div className="person-node-top">
                      <div className="person-node-avatar male">GH</div>
                      <div className="person-node-meta">
                        <div className="person-node-name">George Harrison</div>
                        <div className="person-node-years">1920 – 1998</div>
                      </div>
                    </div>
                    <div className="person-node-footer">
                      <span className="badge badge-male">Grandfather</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>2 Children</span>
                    </div>
                  </div>
                </div>

                <div className="spouse-edge-badge" style={{ pointerEvents: 'none' }}>
                  <Heart size={12} fill="currentColor" />
                </div>

                <div className="person-node" style={{ pointerEvents: 'none' }}>
                  <div className="person-node-inner">
                    <div className="person-node-top">
                      <div className="person-node-avatar female">MH</div>
                      <div className="person-node-meta">
                        <div className="person-node-name">Mary Harrison</div>
                        <div className="person-node-years">1924 – 2005</div>
                      </div>
                    </div>
                    <div className="person-node-footer">
                      <span className="badge badge-female">Grandmother</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>2 Children</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting vertical indicator */}
              <div style={{ width: '2px', height: '30px', backgroundColor: 'var(--primary)', margin: '-16px 0' }} />

              {/* Generation 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div className="person-node selected" style={{ pointerEvents: 'none' }}>
                  <div className="person-node-inner">
                    <div className="person-node-top">
                      <div className="person-node-avatar male">RH</div>
                      <div className="person-node-meta">
                        <div className="person-node-name">Robert Harrison</div>
                        <div className="person-node-years">b. 1952</div>
                      </div>
                    </div>
                    <div className="person-node-footer">
                      <span className="badge badge-male">Father</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>2 Children</span>
                    </div>
                  </div>
                </div>

                <div className="spouse-edge-badge" style={{ pointerEvents: 'none' }}>
                  <Heart size={12} fill="currentColor" />
                </div>

                <div className="person-node" style={{ pointerEvents: 'none' }}>
                  <div className="person-node-inner">
                    <div className="person-node-top">
                      <div className="person-node-avatar female">AH</div>
                      <div className="person-node-meta">
                        <div className="person-node-name">Anna Harrison</div>
                        <div className="person-node-years">b. 1955</div>
                      </div>
                    </div>
                    <div className="person-node-footer">
                      <span className="badge badge-female">Mother</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>2 Children</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Overview */}
        <section style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          padding: '80px 24px'
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>Designed for Authentic Genealogy</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '580px', margin: '0 auto' }}>
                Built from the ground up to respect real family structures, privacy, and generational history.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px'
            }}>
              <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <GitFork size={22} style={{ transform: 'rotate(180deg)' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Smart Generational Canvas</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6' }}>
                  Smooth interactive zoom, pan, and automated layout that arranges ancestors, spouses, and children without visual clutter.
                </p>
              </div>

              <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-amber-light)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <ImageIcon size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Compressed Portrait Storage</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6' }}>
                  Upload vintage or modern photographs. In-browser compression prevents slow load times and protects bandwidth.
                </p>
              </div>

              <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Share2 size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Secure Sharing & Roles</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6' }}>
                  Invite relatives with granular Owner, Editor, or Viewer roles powered by Supabase Row Level Security (RLS).
                </p>
              </div>

              <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-amber-light)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Heart size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Real-World Relationships</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6' }}>
                  Supports single parents, multiple marriages, and blended lineages. Never assumes a rigid two-parent structure.
                </p>
              </div>

              <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Search size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Fast Relative Search</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6' }}>
                  Instant search across first, middle, or maiden names. Automatically smoothly centers the canvas on your relative.
                </p>
              </div>

              <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-amber-light)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <ShieldCheck size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Data Privacy First</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6' }}>
                  Your lineage belongs to you. Database-level RLS prevents unauthorized viewing of private family trees.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '32px 24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <GitFork size={18} style={{ transform: 'rotate(180deg)', color: 'var(--primary)' }} />
            <span>Kith & Kin</span>
          </div>
          <div>Preserving family history across generations.</div>
        </div>
      </footer>
    </div>
  );
}
