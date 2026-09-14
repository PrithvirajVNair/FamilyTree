import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageCompressor';
import { getDemoFamilyData } from '../utils/demoData';
import { validateNewRelationship } from '../utils/relationshipUtils';

export function useFamilyData(familyId, currentUserId) {
  const [family, setFamily] = useState(null);
  const [people, setPeople] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [userRole, setUserRole] = useState('viewer'); // 'owner' | 'editor' | 'viewer'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchFamilyData = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch family container
      const { data: familyData, error: famErr } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (famErr) throw famErr;
      setFamily(familyData);

      // Determine user role
      if (familyData.owner_id === currentUserId) {
        setUserRole('owner');
      } else {
        const { data: collab } = await supabase
          .from('family_collaborators')
          .select('role')
          .eq('family_id', familyId)
          .eq('user_id', currentUserId)
          .single();

        setUserRole(collab?.role || 'viewer');
      }

      // 2. Fetch people in this family
      const { data: peopleData, error: peopleErr } = await supabase
        .from('people')
        .select('*')
        .eq('family_id', familyId)
        .order('first_name', { ascending: true });

      if (peopleErr) throw peopleErr;
      setPeople(peopleData || []);

      // 3. Fetch relationships in this family
      const { data: relData, error: relErr } = await supabase
        .from('relationships')
        .select('*')
        .eq('family_id', familyId);

      if (relErr) throw relErr;
      setRelationships(relData || []);
    } catch (err) {
      console.error('Error loading family data:', err);
      setError(err.message || 'Failed to load family tree.');
    } finally {
      setLoading(false);
    }
  }, [familyId, currentUserId]);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);

  // Upload photo to Supabase Storage with compression
  const uploadPhoto = async (personId, file) => {
    try {
      const compressed = await compressImage(file, 800, 0.82);
      const fileName = `${familyId}/${personId}-${Date.now()}.webp`;

      const { data, error: uploadErr } = await supabase.storage
        .from('family-photos')
        .upload(fileName, compressed, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadErr) {
        console.warn('Storage upload notice, falling back to local object URL:', uploadErr);
        return URL.createObjectURL(compressed);
      }

      const { data: pubData } = supabase.storage.from('family-photos').getPublicUrl(fileName);
      return pubData?.publicUrl || URL.createObjectURL(compressed);
    } catch (e) {
      console.warn('Photo processing error:', e);
      return null;
    }
  };

  // Add person
  const addPerson = async (personInput, photoFile, relativeConnection = null) => {
    setSaving(true);
    try {
      let photo_url = personInput.photo_url || null;

      // 1. Insert person
      const tempId = `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      if (photoFile) {
        const uploaded = await uploadPhoto(tempId, photoFile);
        if (uploaded) photo_url = uploaded;
      }

      const payload = {
        family_id: familyId,
        first_name: personInput.first_name.trim(),
        middle_name: personInput.middle_name ? personInput.middle_name.trim() : null,
        last_name: personInput.last_name ? personInput.last_name.trim() : null,
        gender: personInput.gender || 'Unknown',
        birth_date: personInput.birth_date || null,
        death_date: personInput.death_date || null,
        birth_place: personInput.birth_place ? personInput.birth_place.trim() : null,
        notes: personInput.notes ? personInput.notes.trim() : null,
        photo_url,
      };

      const { data: newPerson, error: insertErr } = await supabase
        .from('people')
        .insert(payload)
        .select()
        .single();

      if (insertErr) throw insertErr;

      // If added in context of an existing relative (e.g. "+ Add Child", "+ Add Parent", "+ Add Spouse")
      if (relativeConnection && newPerson) {
        const { targetPersonId, relationType } = relativeConnection;
        // relationType can be:
        // - 'parent' (new person is parent of targetPerson)
        // - 'child' (new person is child of targetPerson -> targetPerson is parent of newPerson)
        // - 'spouse' (new person is spouse of targetPerson)
        if (relationType === 'parent') {
          await addRelationship(newPerson.id, targetPersonId, 'parent');
        } else if (relationType === 'child') {
          await addRelationship(targetPersonId, newPerson.id, 'parent');
        } else if (relationType === 'spouse') {
          await addRelationship(newPerson.id, targetPersonId, 'spouse');
        }
      }

      setPeople((prev) => [...prev, newPerson]);
      return newPerson;
    } catch (err) {
      console.error('Error adding person:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Update person
  const updatePerson = async (personId, updates, newPhotoFile) => {
    setSaving(true);
    try {
      let photo_url = updates.photo_url;
      if (newPhotoFile) {
        const uploaded = await uploadPhoto(personId, newPhotoFile);
        if (uploaded) photo_url = uploaded;
      }

      const payload = {
        first_name: updates.first_name.trim(),
        middle_name: updates.middle_name ? updates.middle_name.trim() : null,
        last_name: updates.last_name ? updates.last_name.trim() : null,
        gender: updates.gender || 'Unknown',
        birth_date: updates.birth_date || null,
        death_date: updates.death_date || null,
        birth_place: updates.birth_place ? updates.birth_place.trim() : null,
        notes: updates.notes ? updates.notes.trim() : null,
        photo_url,
      };

      const { data: updated, error: updateErr } = await supabase
        .from('people')
        .update(payload)
        .eq('id', personId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      setPeople((prev) => prev.map((p) => (p.id === personId ? { ...p, ...payload } : p)));
      return updated;
    } catch (err) {
      console.error('Error updating person:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Delete person (and cascade remove relationships)
  const deletePerson = async (personId) => {
    setSaving(true);
    try {
      // Delete person from Supabase (DB constraints cascade relationships, or local mock cleans them)
      const { error: delErr } = await supabase.from('people').delete().eq('id', personId);
      if (delErr) throw delErr;

      // Update state
      setPeople((prev) => prev.filter((p) => p.id !== personId));
      setRelationships((prev) =>
        prev.filter((r) => r.person_1_id !== personId && r.person_2_id !== personId)
      );
    } catch (err) {
      console.error('Error deleting person:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Add relationship
  const addRelationship = async (person1Id, person2Id, relationshipType) => {
    const validation = validateNewRelationship(person1Id, person2Id, relationshipType, relationships);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    setSaving(true);
    try {
      const payload = {
        family_id: familyId,
        person_1_id: person1Id,
        person_2_id: person2Id,
        relationship_type: relationshipType,
      };

      const { data: newRel, error: relErr } = await supabase
        .from('relationships')
        .insert(payload)
        .select()
        .single();

      if (relErr) throw relErr;

      setRelationships((prev) => [...prev, newRel]);
      return newRel;
    } catch (err) {
      console.error('Error adding relationship:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Delete relationship
  const deleteRelationship = async (relId) => {
    setSaving(true);
    try {
      const { error: delErr } = await supabase.from('relationships').delete().eq('id', relId);
      if (delErr) throw delErr;

      setRelationships((prev) => prev.filter((r) => r.id !== relId));
    } catch (err) {
      console.error('Error deleting relationship:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Load sample demo tree
  const loadDemoData = async () => {
    setSaving(true);
    try {
      const demo = getDemoFamilyData(familyId);

      // Insert people
      for (const p of demo.people) {
        await supabase.from('people').insert(p);
      }

      // Insert relationships
      for (const r of demo.relationships) {
        await supabase.from('relationships').insert(r);
      }

      setPeople(demo.people);
      setRelationships(demo.relationships);
    } catch (err) {
      console.error('Error loading demo tree:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    family,
    people,
    relationships,
    userRole,
    canEdit: userRole === 'owner' || userRole === 'editor',
    loading,
    saving,
    error,
    refresh: fetchFamilyData,
    addPerson,
    updatePerson,
    deletePerson,
    addRelationship,
    deleteRelationship,
    loadDemoData,
  };
}
