import { createFamilyGraph } from './familyGraph.js';

/**
 * Builds a scoped, visible tree view around a chosen root person.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE:
 * This function determines WHO should be visible in the current visual perspective.
 * It does NOT compute visual coordinate positions (which is the job of familyTreeLayout.js).
 * It preserves the exact same person records without duplicating database entities.
 *
 * @param {Object} params
 * @param {string} params.rootPersonId - ID of the person at the center of the tree view
 * @param {Array} params.people - Full list of people in this family from Supabase
 * @param {Array} params.relationships - Full list of relationships from Supabase
 * @param {Object} [params.options] - Traversal limits
 * @param {number} [params.options.ancestors=2] - Levels of ancestors to include (parents, grandparents)
 * @param {number} [params.options.descendants=2] - Levels of descendants to include (children, grandchildren)
 * @param {boolean} [params.options.includeSpouses=true] - Whether to include spouses of visible members
 * @param {boolean} [params.options.includeSiblings=true] - Whether to include siblings of the root and descendants
 * @returns {Object} { people, relationships, rootPerson, allPeopleCount, isFiltered }
 */
export function buildFamilyTreeView({
  rootPersonId,
  people = [],
  relationships = [],
  options = {},
}) {
  if (!people || people.length === 0) {
    return {
      people: [],
      relationships: [],
      rootPerson: null,
      allPeopleCount: 0,
      isFiltered: false,
      allRelativesWithKinship: [],
    };
  }

  const {
    ancestors = 2,
    descendants = 2,
    includeSpouses = true,
    includeSiblings = true,
    customIncludedIds = null, // Set or Array of IDs, or null if using auto traversal
    showAllConnected = false,
  } = options;

  const graph = createFamilyGraph(people, relationships);

  // 1. Determine Root Person
  let rootPerson = rootPersonId ? graph.getPerson(rootPersonId) : null;

  // Fallback if rootPersonId is not found or not provided:
  if (!rootPerson) {
    const peopleWithParents = new Set(
      relationships
        .filter((r) => r.relationship_type === 'parent')
        .map((r) => r.person_2_id)
    );
    const rootAncestors = people.filter((p) => !peopleWithParents.has(p.id));
    rootPerson = rootAncestors[0] || people[0];
  }

  if (!rootPerson) {
    return {
      people,
      relationships,
      rootPerson: null,
      allPeopleCount: people.length,
      isFiltered: false,
      allRelativesWithKinship: [],
    };
  }

  // 2. Determine visible person IDs around rootPerson
  let visibleIds = new Set();

  if (customIncludedIds && (Array.isArray(customIncludedIds) || customIncludedIds instanceof Set)) {
    // Explicit user-selected members mode
    const customSet = new Set(customIncludedIds);
    customSet.add(rootPerson.id); // Root person is always maintained
    visibleIds = customSet;
  } else if (showAllConnected) {
    // Show entire connected component
    visibleIds = graph.getAllConnectedIds(rootPerson.id);
  } else {
    // Traversal presets mode
    visibleIds.add(rootPerson.id);

    // A. Ancestors up to specified depth
    if (ancestors > 0) {
      const ancestorIds = graph.getAncestors(rootPerson.id, ancestors);
      ancestorIds.forEach((id) => visibleIds.add(id));
    }

    // B. Descendants up to specified depth
    if (descendants > 0) {
      const descendantIds = graph.getDescendants(rootPerson.id, descendants);
      descendantIds.forEach((id) => visibleIds.add(id));
    }

    // C. Siblings of the root person and visible bloodline members
    if (includeSiblings) {
      const rootSiblings = graph.getSiblingIds(rootPerson.id);
      rootSiblings.forEach((id) => visibleIds.add(id));

      if (descendants > 0) {
        const descendantIds = graph.getDescendants(rootPerson.id, descendants);
        descendantIds.forEach((dId) => {
          const sibs = graph.getSiblingIds(dId);
          sibs.forEach((id) => visibleIds.add(id));
        });
      }
    }

    // D. Spouses of all collected members
    if (includeSpouses) {
      const currentVisibleIds = Array.from(visibleIds);
      currentVisibleIds.forEach((id) => {
        const spouseIds = graph.getSpouseIds(id);
        spouseIds.forEach((sId) => visibleIds.add(sId));
      });
    }
  }

  // 3. Filter people and relationships to the visible sub-graph
  const visiblePeople = people.filter((p) => visibleIds.has(p.id));
  const visibleRelationships = relationships.filter(
    (rel) => visibleIds.has(rel.person_1_id) && visibleIds.has(rel.person_2_id)
  );

  const isFiltered = visiblePeople.length < people.length;

  // 4. Annotate all people with kinship labels relative to rootPerson for the selector UI
  const allRelativesWithKinship = people.map((person) => {
    const kinshipLabel = graph.getRelationshipLabel(rootPerson.id, person.id);
    const isVisible = visibleIds.has(person.id);
    const isRoot = person.id === rootPerson.id;

    let categoryOrder = 7;
    if (isRoot) categoryOrder = 0;
    else if (['Father', 'Mother', 'Parent'].includes(kinshipLabel)) categoryOrder = 1;
    else if (['Wife', 'Husband', 'Spouse'].includes(kinshipLabel)) categoryOrder = 2;
    else if (['Son', 'Daughter', 'Child'].includes(kinshipLabel)) categoryOrder = 3;
    else if (['Brother', 'Sister', 'Sibling'].includes(kinshipLabel)) categoryOrder = 4;
    else if (['Grandfather', 'Grandmother', 'Grandparent'].includes(kinshipLabel)) categoryOrder = 5;
    else if (['Grandson', 'Granddaughter', 'Grandchild'].includes(kinshipLabel)) categoryOrder = 6;

    return {
      person,
      kinshipLabel,
      isVisible,
      isRoot,
      categoryOrder,
    };
  }).sort((a, b) => {
    if (a.categoryOrder !== b.categoryOrder) {
      return a.categoryOrder - b.categoryOrder;
    }
    const nameA = `${a.person.first_name || ''} ${a.person.last_name || ''}`.trim();
    const nameB = `${b.person.first_name || ''} ${b.person.last_name || ''}`.trim();
    return nameA.localeCompare(nameB);
  });

  return {
    people: visiblePeople,
    relationships: visibleRelationships,
    rootPerson,
    allPeopleCount: people.length,
    isFiltered,
    allRelativesWithKinship,
  };
}
