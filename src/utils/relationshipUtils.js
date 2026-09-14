/**
 * Utility functions for family relationships, derivations, and formatting.
 */

/**
 * Returns formatted full name of a person.
 */
export function getPersonFullName(person) {
  if (!person) return 'Unknown Person';
  const parts = [person.first_name, person.middle_name, person.last_name].filter(Boolean);
  return parts.join(' ') || 'Unnamed';
}

/**
 * Returns birth/death year string, e.g. "1942 – 2011", "b. 1985", or "Living".
 */
export function getPersonYears(person) {
  if (!person) return '';
  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
  const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null;

  if (birthYear && deathYear) {
    return `${birthYear} – ${deathYear}`;
  }
  if (birthYear && !deathYear) {
    return `b. ${birthYear}`;
  }
  if (!birthYear && deathYear) {
    return `d. ${deathYear}`;
  }
  return '';
}

/**
 * Returns 1-2 letter initials for avatar rendering.
 */
export function getPersonInitials(person) {
  if (!person) return '?';
  const first = person.first_name ? person.first_name.charAt(0).toUpperCase() : '';
  const last = person.last_name ? person.last_name.charAt(0).toUpperCase() : '';
  return `${first}${last}` || '?';
}

/**
 * Get all direct parent IDs for a person.
 * (In relationships, person_1 is parent, person_2 is child, type is 'parent')
 */
export function getParentIds(personId, relationships = []) {
  return relationships
    .filter((rel) => rel.relationship_type === 'parent' && rel.person_2_id === personId)
    .map((rel) => rel.person_1_id);
}

/**
 * Get all direct child IDs for a person.
 */
export function getChildIds(personId, relationships = []) {
  return relationships
    .filter((rel) => rel.relationship_type === 'parent' && rel.person_1_id === personId)
    .map((rel) => rel.person_2_id);
}

/**
 * Get all spouse/partner IDs for a person.
 * (In relationships, spouse relationships can be recorded either as person_1 or person_2)
 */
export function getSpouseIds(personId, relationships = []) {
  const ids = new Set();
  relationships.forEach((rel) => {
    if (rel.relationship_type === 'spouse') {
      if (rel.person_1_id === personId) ids.add(rel.person_2_id);
      if (rel.person_2_id === personId) ids.add(rel.person_1_id);
    }
  });
  return Array.from(ids);
}

/**
 * Derives siblings by checking for shared parents.
 */
export function getSiblingIds(personId, relationships = []) {
  const myParents = getParentIds(personId, relationships);
  if (myParents.length === 0) return [];

  const siblings = new Set();
  myParents.forEach((parentId) => {
    const childrenOfParent = getChildIds(parentId, relationships);
    childrenOfParent.forEach((childId) => {
      if (childId !== personId) {
        siblings.add(childId);
      }
    });
  });

  return Array.from(siblings);
}

/**
 * Checks if a direct relationship already exists.
 */
export function relationshipExists(person1Id, person2Id, type, relationships = []) {
  if (type === 'parent') {
    return relationships.some(
      (rel) => rel.relationship_type === 'parent' && rel.person_1_id === person1Id && rel.person_2_id === person2Id
    );
  }
  if (type === 'spouse') {
    return relationships.some(
      (rel) =>
        rel.relationship_type === 'spouse' &&
        ((rel.person_1_id === person1Id && rel.person_2_id === person2Id) ||
          (rel.person_1_id === person2Id && rel.person_2_id === person1Id))
    );
  }
  return false;
}

/**
 * Validates whether a new relationship can be safely added.
 * Prevents self-linking and generational cycles.
 */
export function validateNewRelationship(person1Id, person2Id, type, relationships = []) {
  if (!person1Id || !person2Id) {
    return { valid: false, message: 'Both persons must be selected.' };
  }
  if (person1Id === person2Id) {
    return { valid: false, message: 'A person cannot be related to themselves.' };
  }

  if (relationshipExists(person1Id, person2Id, type, relationships)) {
    return { valid: false, message: 'This relationship already exists.' };
  }

  if (type === 'parent') {
    // Check if person1 is already a descendant of person2 (cycle check)
    const visited = new Set();
    const queue = [person1Id];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === person2Id) {
        return { valid: false, message: 'Cannot add parent: this would create an ancestry loop / cycle.' };
      }
      visited.add(current);
      const parents = getParentIds(current, relationships);
      for (const p of parents) {
        if (!visited.has(p)) queue.push(p);
      }
    }
  }

  return { valid: true };
}

/**
 * Calculates a genealogical kinship role label (e.g., "Son", "Daughter", "Wife", "Husband", "Father", "Mother").
 */
export function getPersonKinshipRole(person, relationships = []) {
  if (!person) return '';
  const gender = (person.gender || '').toLowerCase();
  const parentIds = getParentIds(person.id, relationships);
  const childIds = getChildIds(person.id, relationships);
  const spouseIds = getSpouseIds(person.id, relationships);

  // 1. If person is a child of someone in the tree
  if (parentIds.length > 0) {
    if (gender === 'male') return 'Son';
    if (gender === 'female') return 'Daughter';
    return 'Child';
  }

  // 2. If person is an in-law married to someone who has parents in the tree
  const isSpouseOfDescendant = spouseIds.some((sId) => getParentIds(sId, relationships).length > 0);
  if (isSpouseOfDescendant) {
    if (gender === 'female') return 'Wife';
    if (gender === 'male') return 'Husband';
    return 'Spouse';
  }

  // 3. If person is an ancestral root with children
  if (childIds.length > 0) {
    if (gender === 'male') return 'Father';
    if (gender === 'female') return 'Mother';
    return 'Parent';
  }

  // 4. If married
  if (spouseIds.length > 0) {
    if (gender === 'female') return 'Wife';
    if (gender === 'male') return 'Husband';
    return 'Spouse';
  }

  // 5. Fallback based on gender
  if (gender === 'male') return 'Family Member';
  if (gender === 'female') return 'Family Member';
  return 'Member';
}

/**
 * Computes birth year and exact age pill label (e.g. { birthYear: 1970, ageText: "54 years old" }).
 */
export function getPersonAgeDetails(person) {
  if (!person) return { birthYear: null, ageText: null };

  let birthYear = null;
  let age = null;

  if (person.birth_date) {
    const bDate = new Date(person.birth_date);
    if (!isNaN(bDate.getTime())) {
      birthYear = bDate.getFullYear();
      const endDate = person.death_date ? new Date(person.death_date) : new Date();
      if (!isNaN(endDate.getTime())) {
        let diffYears = endDate.getFullYear() - bDate.getFullYear();
        const m = endDate.getMonth() - bDate.getMonth();
        if (m < 0 || (m === 0 && endDate.getDate() < bDate.getDate())) {
          diffYears--;
        }
        age = Math.max(0, diffYears);
      }
    }
  }

  let ageText = null;
  if (age !== null) {
    ageText = `${age} years old`;
  } else if (person.death_date) {
    const dDate = new Date(person.death_date);
    if (!isNaN(dDate.getTime())) {
      ageText = `d. ${dDate.getFullYear()}`;
    } else {
      ageText = 'Deceased';
    }
  }

  return { birthYear, ageText };
}

