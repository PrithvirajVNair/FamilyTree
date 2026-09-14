import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { fileToDataUrl } from '../../utils/imageCompressor';
import { getPersonFullName } from '../../utils/relationshipUtils';

export function PersonFormModal({
  isOpen,
  onClose,
  onSubmit, // (formData, photoFile) => Promise
  initialData = null, // if editing
  relativeConnection = null, // { targetPersonId, relationType } if adding relative
  allPeople = [],
  isSaving = false,
}) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Unknown');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Sync initialData or reset on open
  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name || '');
      setMiddleName(initialData.middle_name || '');
      setLastName(initialData.last_name || '');
      setGender(initialData.gender || 'Unknown');
      setBirthDate(initialData.birth_date || '');
      setDeathDate(initialData.death_date || '');
      setBirthPlace(initialData.birth_place || '');
      setNotes(initialData.notes || '');
      setPhotoUrl(initialData.photo_url || '');
      setPreviewUrl(initialData.photo_url || '');
    } else {
      setFirstName('');
      setMiddleName('');
      // If adding child or sibling, prefill last name of target if available
      if (relativeConnection) {
        const target = allPeople.find((p) => p.id === relativeConnection.targetPersonId);
        setLastName(target?.last_name || '');
      } else {
        setLastName('');
      }
      setGender('Unknown');
      setBirthDate('');
      setDeathDate('');
      setBirthPlace('');
      setNotes('');
      setPhotoUrl('');
      setPreviewUrl('');
    }
    setPhotoFile(null);
    setErrors({});
  }, [initialData, relativeConnection, isOpen, allPeople]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Selected file must be an image' }));
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhotoFile(file);
      setPreviewUrl(dataUrl);
      setErrors((prev) => ({ ...prev, photo: null }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, photo: 'Failed to read image preview' }));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPreviewUrl('');
    setPhotoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors = {};
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (birthDate && deathDate && new Date(deathDate) < new Date(birthDate)) {
      newErrors.deathDate = 'Date of death cannot be earlier than date of birth.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      gender,
      birth_date: birthDate || null,
      death_date: deathDate || null,
      birth_place: birthPlace,
      notes,
      photo_url: photoUrl,
    };

    try {
      await onSubmit(payload, photoFile);
      onClose();
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message || 'Failed to save person.' }));
    }
  };

  // Compute relation banner text
  let relationTitle = initialData ? 'Edit Relative' : 'Add Relative';
  if (!initialData && relativeConnection) {
    const target = allPeople.find((p) => p.id === relativeConnection.targetPersonId);
    const targetName = getPersonFullName(target);
    if (relativeConnection.relationType === 'parent') relationTitle = `Add Parent of ${targetName}`;
    if (relativeConnection.relationType === 'child') relationTitle = `Add Child of ${targetName}`;
    if (relativeConnection.relationType === 'spouse') relationTitle = `Add Spouse / Partner of ${targetName}`;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{relationTitle}</h3>
          <button onClick={onClose} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.form && (
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
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Photo Upload Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={28} color="var(--text-muted)" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Portrait Photo</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Images will be resized & compressed automatically before uploading.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-sm btn-outline"
                  >
                    <Upload size={14} />
                    <span>Choose Photo</span>
                  </button>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="btn btn-sm btn-ghost"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                {errors.photo && <div className="form-error">{errors.photo}</div>}
              </div>
            </div>

            {/* Name Fields */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Eleanor"
                  required
                />
                {errors.firstName && <div className="form-error">{errors.firstName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Middle Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. Vance"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Harrison"
                />
              </div>
            </div>

            {/* Gender & Dates */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Death</label>
                <input
                  type="date"
                  className={`form-input ${errors.deathDate ? 'error' : ''}`}
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                />
                {errors.deathDate && <div className="form-error">{errors.deathDate}</div>}
                <span className="form-hint">Leave blank if living</span>
              </div>
            </div>

            {/* Birthplace */}
            <div className="form-group">
              <label className="form-label">Birthplace</label>
              <input
                type="text"
                className="form-input"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="e.g. Edinburgh, Scotland"
              />
            </div>

            {/* Biographical Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes & Biography</label>
              <textarea
                rows={3}
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Memories, profession, achievements, historical details..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : initialData ? 'Save Changes' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
