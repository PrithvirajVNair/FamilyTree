import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { useAuth } from '../context/AuthContext';
import { useFamilyData } from '../hooks/useFamilyData';
import { Navbar } from '../components/layout/Navbar';
import { TreeToolbar } from '../components/tree/TreeToolbar';
import { TreeBreadcrumb } from '../components/tree/TreeBreadcrumb';
import { TreeCanvasInner } from '../components/tree/TreeCanvas';
import { ViewFilterModal } from '../components/tree/ViewFilterModal';
import { PersonDetailDrawer } from '../components/person/PersonDetailDrawer';
import { PersonFormModal } from '../components/person/PersonFormModal';
import { ConnectModal } from '../components/person/ConnectModal';
import { DeleteConfirmModal } from '../components/person/DeleteConfirmModal';
import { buildFamilyTreeView } from '../utils/familyTreeView';
import { AlertCircle } from 'lucide-react';

export function FamilyTree() {
  const { familyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPersonId = searchParams.get('person');

  const {
    family,
    people,
    relationships,
    canEdit,
    loading,
    saving,
    error,
    addPerson,
    updatePerson,
    deletePerson,
    addRelationship,
    deleteRelationship,
    loadDemoData,
  } = useFamilyData(familyId, user?.id);

  // View filtering & customization state (who should be there in this view)
  const [viewOptions, setViewOptions] = useState({
    ancestors: 2,
    descendants: 2,
    includeSpouses: true,
    includeSiblings: true,
    customIncludedIds: null,
    showAllConnected: false,
  });
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Sub-Graph Generation: Filter visible people and relationships around active root person
  const {
    people: visiblePeople,
    relationships: visibleRelationships,
    rootPerson,
    allPeopleCount,
    isFiltered,
    allRelativesWithKinship,
  } = useMemo(() => {
    return buildFamilyTreeView({
      rootPersonId: urlPersonId,
      people,
      relationships,
      options: viewOptions,
    });
  }, [urlPersonId, people, relationships, viewOptions]);

  // Sync default root person to URL if no ?person= query param is specified
  useEffect(() => {
    if (!urlPersonId && rootPerson?.id) {
      setSearchParams({ person: rootPerson.id }, { replace: true });
    }
  }, [urlPersonId, rootPerson, setSearchParams]);

  // UI state
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [highlightedPersonId, setHighlightedPersonId] = useState(null);
  const [showMinimap, setShowMinimap] = useState(true);

  // Modals state
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [relativeConnection, setRelativeConnection] = useState(null); // { targetPersonId, relationType }
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState(null);

  const fitViewRef = useRef(null);
  const resetLayoutRef = useRef(null);

  // Switch root person view (Explore Family)
  const handleExploreFamily = useCallback(
    (personId, openCustomize = false) => {
      if (!personId) return;
      // Reset custom member overrides when jumping to a new person perspective
      setViewOptions((prev) => ({
        ...prev,
        customIncludedIds: null,
        showAllConnected: false,
      }));
      setSearchParams({ person: personId });
      setHighlightedPersonId(personId);
      if (openCustomize) {
        setFilterModalOpen(true);
      }
      setTimeout(() => {
        setHighlightedPersonId((curr) => (curr === personId ? null : curr));
      }, 2500);
    },
    [setSearchParams]
  );

  // Reset view filter back to default
  const handleResetView = useCallback(() => {
    setViewOptions({
      ancestors: 2,
      descendants: 2,
      includeSpouses: true,
      includeSiblings: true,
      customIncludedIds: null,
      showAllConnected: false,
    });
  }, []);

  // Handling person selection (from canvas or search)
  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    if (person) {
      setHighlightedPersonId(person.id);
      // Remove highlight animation after 2.5 seconds
      setTimeout(() => {
        setHighlightedPersonId((curr) => (curr === person.id ? null : curr));
      }, 2500);
    } else {
      setHighlightedPersonId(null);
    }
  };

  // Open person creation modal for a relative
  const handleAddRelative = ({ targetPersonId, relationType }) => {
    setEditingPerson(null);
    setRelativeConnection({ targetPersonId, relationType });
    setPersonModalOpen(true);
  };


  // Open person edit modal
  const handleEditPerson = (person) => {
    setEditingPerson(person);
    setRelativeConnection(null);
    setPersonModalOpen(true);
  };

  // Handle person form submit (Add or Update)
  const handlePersonSubmit = async (formData, photoFile) => {
    if (editingPerson) {
      const updated = await updatePerson(editingPerson.id, formData, photoFile);
      setSelectedPerson(updated);
    } else {
      const created = await addPerson(formData, photoFile, relativeConnection);
      setSelectedPerson(created);
    }
  };

  // Handle person delete
  const handleConfirmDelete = async () => {
    if (!deletingPerson) return;
    await deletePerson(deletingPerson.id);
    if (selectedPerson?.id === deletingPerson.id) {
      setSelectedPerson(null);
    }
    setDeletingPerson(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading family tree records...</p>
        </div>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
          <AlertCircle size={40} color="var(--danger)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Family Tree Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px' }}>
            {error || "This family tree does not exist or you don't have authorization to view it."}
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-page)' }}>
      {/* 1. Header */}
      <Navbar familyName={family.name} familyId={family.id} />

      {/* 2. Toolbar */}
      <TreeToolbar
        people={people}
        onSelectPerson={handleSelectPerson}
        onOpenAddModal={() => {
          setEditingPerson(null);
          setRelativeConnection(null);
          setPersonModalOpen(true);
        }}
        onOpenConnectModal={() => setConnectModalOpen(true)}
        onLoadDemo={loadDemoData}
        onFitView={() => fitViewRef.current?.()}
        onResetLayout={() => resetLayoutRef.current?.()}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap((prev) => !prev)}
        canEdit={canEdit}
      />

      {/* 2b. Navigation Context & Perspective Breadcrumb */}
      <TreeBreadcrumb
        rootPerson={rootPerson}
        onNavigateBack={() => navigate(-1)}
        canGoBack={true}
        onResetToMain={handleResetView}
        onOpenFilterModal={() => setFilterModalOpen(true)}
        totalPeopleCount={allPeopleCount}
        visiblePeopleCount={visiblePeople.length}
        isFiltered={isFiltered}
      />

      {/* 3. Interactive Family Tree Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ReactFlowProvider>
          <TreeCanvasInner
            people={visiblePeople}
            relationships={visibleRelationships}
            selectedPerson={selectedPerson}
            highlightedPersonId={highlightedPersonId}
            onSelectPerson={handleSelectPerson}
            onOpenAddModal={() => {
              setEditingPerson(null);
              setRelativeConnection(null);
              setPersonModalOpen(true);
            }}
            onLoadDemo={loadDemoData}
            onAddRelationship={addRelationship}
            showMinimap={showMinimap}
            canEdit={canEdit}
            fitViewRef={fitViewRef}
            resetLayoutRef={resetLayoutRef}
          />
        </ReactFlowProvider>

        {/* 4. Person Details Drawer */}
        {selectedPerson && (
          <PersonDetailDrawer
            person={selectedPerson}
            allPeople={people}
            relationships={relationships}
            rootPersonId={rootPerson?.id}
            onExploreFamily={handleExploreFamily}
            onOpenFilterModal={(targetPersonId) => {
              if (targetPersonId && targetPersonId !== rootPerson?.id) {
                handleExploreFamily(targetPersonId, true);
              } else {
                setFilterModalOpen(true);
              }
            }}
            onClose={() => setSelectedPerson(null)}
            onEdit={handleEditPerson}
            onDelete={(p) => setDeletingPerson(p)}
            onAddRelative={handleAddRelative}
            onAddRelationship={addRelationship}
            onDeleteRelationship={deleteRelationship}
            onSelectPerson={handleSelectPerson}
            canEdit={canEdit}
          />
        )}
      </div>

      {/* View Filter / Select Who Should Be There Modal */}
      <ViewFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        rootPerson={rootPerson}
        allRelativesWithKinship={allRelativesWithKinship}
        currentOptions={viewOptions}
        onApplyOptions={(newOpts) => {
          setViewOptions((prev) => ({ ...prev, ...newOpts }));
        }}
      />

      {/* Add / Edit Person Form Modal */}
      <PersonFormModal
        isOpen={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        onSubmit={handlePersonSubmit}
        initialData={editingPerson}
        relativeConnection={relativeConnection}
        allPeople={people}
        isSaving={saving}
      />

      {/* Connect Relatives Modal */}
      <ConnectModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        people={people}
        relationships={relationships}
        onConnect={addRelationship}
        isSaving={saving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingPerson)}
        person={deletingPerson}
        onClose={() => setDeletingPerson(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={saving}
      />
    </div>
  );
}
