import { createFamilyGraph } from './familyGraph.js';
import { getPersonKinshipRole } from './relationshipUtils.js';

/**
 * Builds a scoped, visible tree view around a chosen root person,
 * or returns the full unrooted family tree if no root person is specified.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE:
 * In a family tree, no single person is the default root. By default, the full
 * family tree (all connected relatives) is displayed without filtering.
 * Only when a user explicitly chooses to focus on or explore a specific person
 * is a scoped sub-graph generated around that person.
 *
 * @param {Object} params
 * @param {string} [params.rootPersonId] - ID of the person to focus the tree around (optional)
 * @param {Array} params.people - Full list of people in this family from Supabase
 * @param {Array} params.relationships - Full list of relationships from Supabase
 * @param {Object} [params.options] - Traversal limits
 * @param {number} [params.options.ancestors=2] - Levels of ancestors to include
 * @param {number} [params.options.descendants=2] - Levels of descendants to include
 * @param {boolean} [params.options.includeSpouses=true] - Whether to include spouses
 * @param {boolean} [params.options.includeSiblings=true] - Whether to include siblings
 * @param {Set|Array} [params.options.customIncludedIds] - Explicit member IDs to display
 * @param {boolean} [params.options.showAllConnected] - Whether to show all connected members
 * @returns {Object} { people, relationships, rootPerson, allPeopleCount, isFiltered, allRelativesWithKinship }
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
    customIncludedIds = null,
    showAllConnected = false,
  } = options;

  const graph = createFamilyGraph(people, relationships);

  // 1. Determine Root Person (ONLY if explicitly specified and exists in graph)
  const rootPerson = rootPersonId ? graph.getPerson(rootPersonId) : null;

  // 2. Determine visible person IDs
  let visibleIds = new Set();

  if (!rootPerson) {
    // UNROOTED FULL FAMILY VIEW
    // No one is root: default to displaying all people unless custom IDs are given
    if (customIncludedIds && (Array.isArray(customIncludedIds) || customIncludedIds instanceof Set)) {
      visibleIds = new Set(customIncludedIds);
    } else {
      visibleIds = new Set(people.map((p) => p.id));
    }
  } else if (customIncludedIds && (Array.isArray(customIncludedIds) || customIncludedIds instanceof Set)) {
    // Explicit user-selected members mode around focused root
    const customSet = new Set(customIncludedIds);
    customSet.add(rootPerson.id);
    visibleIds = customSet;
  } else if (showAllConnected) {
    // Show entire connected component of root
    visibleIds = graph.getAllConnectedIds(rootPerson.id);
  } else {
    // Traversal presets mode scoped to focused root person
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

  // 4. Annotate all people with kinship labels for the selector UI / detail drawer
  const allRelativesWithKinship = people.map((person) => {
    const isVisible = visibleIds.has(person.id);

    if (rootPerson) {
      const isRoot = person.id === rootPerson.id;
      const kinshipLabel = graph.getRelationshipLabel(rootPerson.id, person.id);

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
    }

    // When there is no root person, use general genealogical kinship role
    const kinshipLabel = getPersonKinshipRole(person, relationships);
    return {
      person,
      kinshipLabel,
      isVisible,
      isRoot: false,
      categoryOrder: 1,
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
