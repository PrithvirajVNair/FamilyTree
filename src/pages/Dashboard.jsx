import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  GitFork,
  MoreVertical,
  Calendar,
  Clock,
  Users,
  Trash2,
  Edit2,
  FolderOpen,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { CreateFamilyModal } from '../components/family/CreateFamilyModal';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFamilies = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch families user owns or collaborates on
      const { data: owned, error: ownedErr } = await supabase
        .from('families')
        .select('*')
        .order('updated_at', { ascending: false });

      if (ownedErr) throw ownedErr;

      // 2. Fetch people counts for each family
      const enriched = await Promise.all(
        (owned || []).map(async (fam) => {
          const { data: famPeople } = await supabase
            .from('people')
            .select('id')
            .eq('family_id', fam.id);

          return {
            ...fam,
            peopleCount: famPeople?.length || 0,
          };
        })
      );

      setFamilies(enriched);
    } catch (err) {
      console.error('Error fetching families:', err);
      setError(err.message || 'Failed to load family trees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, [user]);

  // Create new family tree and automatically navigate into it
  const handleCreateFamily = async ({ name, description }) => {
    if (!user) return;
    const payload = {
      name,
      description: description || null,
      owner_id: user.id,
    };

    const { data, error: insertErr } = await supabase
      .from('families')
      .insert(payload)
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Open family tree editor directly
    navigate(`/family/${data.id}`);
  };

  // Rename family
  const handleSaveRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      const { error: updErr } = await supabase
        .from('families')
        .update({ name: renameValue.trim() })
        .eq('id', renameTarget.id);

      if (updErr) throw updErr;

      setFamilies((prev) =>
        prev.map((f) => (f.id === renameTarget.id ? { ...f, name: renameValue.trim() } : f))
      );
      setRenameTarget(null);
    } catch (err) {
      alert('Failed to rename family tree: ' + err.message);
    }
  };

  // Delete family tree
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase
        .from('families')
        .delete()
        .eq('id', deleteTarget.id);

      if (delErr) throw delErr;

      setFamilies((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete family tree: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              My Family Trees
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Explore, manage, and preserve your ancestral lineage.
            </p>
          </div>

          <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-lg">
            <Plus size={18} />
            <span>Create Family Tree</span>
          </button>
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
            fontSize: '0.9rem',
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 0',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ color: 'var(--text-muted)' }}>Loading family records...</span>
          </div>
        ) : families.length === 0 ? (
          /* Empty State */
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1.5px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '70px 24px',
            textAlign: 'center',
            maxWidth: '560px',
            margin: '40px auto'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <GitFork size={30} style={{ transform: 'rotate(180deg)' }} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              You haven't created a family tree yet.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Start documenting your family's story, preserving connections, and visualizing your heritage across generations.
            </p>
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-lg">
              <Plus size={18} />
              <span>Create Your First Tree</span>
            </button>
          </div>
        ) : (
          /* Grid of Family Cards */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
          }}>
            {families.map((fam) => (
              <div
                key={fam.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all var(--transition-normal)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ padding: '24px 20px', flex: 1 }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <GitFork size={20} style={{ transform: 'rotate(180deg)' }} />
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: '1.3',
                        }}>
                          {fam.name}
                        </h3>
                        {fam.description && (
                          <p style={{
                            fontSize: '0.825rem',
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {fam.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Menu Button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === fam.id ? null : fam.id);
                        }}
                        className="btn-ghost"
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: '6px',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === fam.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 4px)',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            width: '160px',
                            zIndex: 50,
                            padding: '4px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setRenameTarget(fam);
                              setRenameValue(fam.name);
                            }}
                            className="btn-ghost"
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 10px',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <Edit2 size={14} />
                            <span>Rename</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeleteTarget(fam);
                            }}
                            className="btn-ghost"
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 10px',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              color: 'var(--danger)'
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Delete Tree</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Metadata */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-light)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={14} color="var(--primary)" />
                      <strong style={{ color: 'var(--text-primary)' }}>{fam.peopleCount}</strong> people
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} />
                      Updated {new Date(fam.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Open Tree Action */}
                <div style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--bg-surface-hover)',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => navigate(`/family/${fam.id}`)}
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FolderOpen size={15} />
                      <span>Open Family Tree</span>
                    </span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Family Modal */}
      <CreateFamilyModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateFamily}
      />

      {/* Rename Modal */}
      {renameTarget && (
        <div className="modal-backdrop" onClick={() => setRenameTarget(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Rename Family Tree</h3>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tree Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setRenameTarget(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveRename} className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>Delete Family Tree?</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? All member records and relationships will be permanently removed.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary" disabled={isDeleting}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="btn btn-danger" disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Tree'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
