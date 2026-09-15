/**
 * In-memory Family Graph Data Structure and Traversal Utilities.
 * Builds fast indexed lookups from people and relationships fetched from Supabase,
 * eliminating repeated database queries when navigating or calculating kinship.
 */

export class FamilyGraph {
  constructor(people = [], relationships = []) {
    this.peopleMap = new Map();
    this.parentsMap = new Map(); // childId -> Set<parentId>
    this.childrenMap = new Map(); // parentId -> Set<childId>
    this.spousesMap = new Map(); // personId -> Set<spouseId>
    this.relationships = relationships;

    this._buildGraph(people, relationships);
  }

  _buildGraph(people, relationships) {
    // 1. Index people
    people.forEach((p) => {
      this.peopleMap.set(p.id, p);
      this.parentsMap.set(p.id, new Set());
      this.childrenMap.set(p.id, new Set());
      this.spousesMap.set(p.id, new Set());
    });

    // 2. Index relationships
    relationships.forEach((rel) => {
      const { person_1_id, person_2_id, relationship_type } = rel;
      if (!this.peopleMap.has(person_1_id) || !this.peopleMap.has(person_2_id)) {
        return;
      }

      if (relationship_type === 'parent') {
        // person_1 is parent, person_2 is child
        this.childrenMap.get(person_1_id)?.add(person_2_id);
        this.parentsMap.get(person_2_id)?.add(person_1_id);
      } else if (relationship_type === 'spouse') {
        // Bidirectional spouse relationship
        this.spousesMap.get(person_1_id)?.add(person_2_id);
        this.spousesMap.get(person_2_id)?.add(person_1_id);
      }
    });
  }

  getPerson(personId) {
    return this.peopleMap.get(personId) || null;
  }

  getAllPeople() {
    return Array.from(this.peopleMap.values());
  }

  getParentIds(personId) {
    return Array.from(this.parentsMap.get(personId) || []);
  }

  getParents(personId) {
    return this.getParentIds(personId)
      .map((id) => this.getPerson(id))
      .filter(Boolean);
  }

  getChildIds(personId) {
    return Array.from(this.childrenMap.get(personId) || []);
  }

  getChildren(personId) {
    return this.getChildIds(personId)
      .map((id) => this.getPerson(id))
      .filter(Boolean);
  }

  getSpouseIds(personId) {
    return Array.from(this.spousesMap.get(personId) || []);
  }

  getSpouses(personId) {
    return this.getSpouseIds(personId)
      .map((id) => this.getPerson(id))
      .filter(Boolean);
  }

  getSiblingIds(personId) {
    const parentIds = this.getParentIds(personId);
    if (parentIds.length === 0) return [];

    const siblingIds = new Set();
    parentIds.forEach((pId) => {
      const children = this.getChildIds(pId);
      children.forEach((cId) => {
        if (cId !== personId) {
          siblingIds.add(cId);
        }
      });
    });

    return Array.from(siblingIds);
  }

  getSiblings(personId) {
    return this.getSiblingIds(personId)
      .map((id) => this.getPerson(id))
      .filter(Boolean);
  }

  /**
   * Traverses ancestors upwards (parents -> grandparents -> etc.) up to maxDepth.
   * depth 1 = parents, depth 2 = grandparents, etc.
   * Returns Set of ancestor person IDs.
   */
  getAncestors(personId, maxDepth = 2) {
    const ancestors = new Set();
    if (!this.peopleMap.has(personId) || maxDepth <= 0) return ancestors;

    let currentLevel = new Set([personId]);
    for (let depth = 1; depth <= maxDepth; depth++) {
      const nextLevel = new Set();
      currentLevel.forEach((id) => {
        const parents = this.getParentIds(id);
        parents.forEach((pId) => {
          if (!ancestors.has(pId)) {
            ancestors.add(pId);
            nextLevel.add(pId);
          }
        });
      });

      if (nextLevel.size === 0) break;
      currentLevel = nextLevel;
    }

    return ancestors;
  }

  /**
   * Traverses descendants downwards (children -> grandchildren -> etc.) up to maxDepth.
   * depth 1 = children, depth 2 = grandchildren, etc.
   * Returns Set of descendant person IDs.
   */
  getDescendants(personId, maxDepth = 2) {
    const descendants = new Set();
    if (!this.peopleMap.has(personId) || maxDepth <= 0) return descendants;

    let currentLevel = new Set([personId]);
    for (let depth = 1; depth <= maxDepth; depth++) {
      const nextLevel = new Set();
      currentLevel.forEach((id) => {
        const children = this.getChildIds(id);
        children.forEach((cId) => {
          if (!descendants.has(cId)) {
            descendants.add(cId);
            nextLevel.add(cId);
          }
        });
      });

      if (nextLevel.size === 0) break;
      currentLevel = nextLevel;
    }

    return descendants;
  }

  /**
   * Returns all connected person IDs reachable from startPersonId via any relationship.
   */
  getAllConnectedIds(startPersonId) {
    const visited = new Set();
    if (!this.peopleMap.has(startPersonId)) return visited;

    const queue = [startPersonId];
    visited.add(startPersonId);

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = [
        ...this.getParentIds(current),
        ...this.getChildIds(current),
        ...this.getSpouseIds(current),
      ];

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return visited;
  }

  /**
   * Computes a natural relative kinship title for targetPersonId relative to rootPersonId.
   * e.g., 'Father', 'Mother', 'Sister', 'Spouse', 'Son', 'Grandfather', 'In-law', etc.
   */
  getRelationshipLabel(rootPersonId, targetPersonId) {
    if (!rootPersonId || !targetPersonId) return 'Relative';
    if (rootPersonId === targetPersonId) return 'Focused Person';

    const target = this.getPerson(targetPersonId);
    const gender = target?.gender?.toLowerCase();
    const isFemale = gender === 'female';
    const isMale = gender === 'male';

    const rootParents = new Set(this.getParentIds(rootPersonId));
    const rootChildren = new Set(this.getChildIds(rootPersonId));
    const rootSpouses = new Set(this.getSpouseIds(rootPersonId));
    const rootSiblings = new Set(this.getSiblingIds(rootPersonId));

    // 1. Direct Parent
    if (rootParents.has(targetPersonId)) {
      return isFemale ? 'Mother' : isMale ? 'Father' : 'Parent';
    }

    // 2. Direct Child
    if (rootChildren.has(targetPersonId)) {
      return isFemale ? 'Daughter' : isMale ? 'Son' : 'Child';
    }

    // 3. Direct Spouse
    if (rootSpouses.has(targetPersonId)) {
      return isFemale ? 'Wife' : isMale ? 'Husband' : 'Spouse';
    }

    // 4. Sibling
    if (rootSiblings.has(targetPersonId)) {
      return isFemale ? 'Sister' : isMale ? 'Brother' : 'Sibling';
    }

    // 5. Grandparents
    for (const pId of rootParents) {
      const grandparents = this.getParentIds(pId);
      if (grandparents.includes(targetPersonId)) {
        return isFemale ? 'Grandmother' : isMale ? 'Grandfather' : 'Grandparent';
      }
    }

    // 6. Grandchildren
    for (const cId of rootChildren) {
      const grandchildren = this.getChildIds(cId);
      if (grandchildren.includes(targetPersonId)) {
        return isFemale ? 'Granddaughter' : isMale ? 'Grandson' : 'Grandchild';
      }
    }

    // 7. Aunt / Uncle (sibling of parent)
    for (const pId of rootParents) {
      const pSiblings = this.getSiblingIds(pId);
      if (pSiblings.includes(targetPersonId)) {
        return isFemale ? 'Aunt' : isMale ? 'Uncle' : 'Aunt / Uncle';
      }
    }

    // 8. Niece / Nephew (child of sibling)
    for (const sId of rootSiblings) {
      const sChildren = this.getChildIds(sId);
      if (sChildren.includes(targetPersonId)) {
        return isFemale ? 'Niece' : isMale ? 'Nephew' : 'Niece / Nephew';
      }
    }

    // 9. In-laws
    // Spouse's parent
    for (const spId of rootSpouses) {
      const spParents = this.getParentIds(spId);
      if (spParents.includes(targetPersonId)) {
        return isFemale ? 'Mother-in-law' : isMale ? 'Father-in-law' : 'Parent-in-law';
      }
    }
    // Spouse's sibling
    for (const spId of rootSpouses) {
      const spSiblings = this.getSiblingIds(spId);
      if (spSiblings.includes(targetPersonId)) {
        return isFemale ? 'Sister-in-law' : isMale ? 'Brother-in-law' : 'Sibling-in-law';
      }
    }
    // Sibling's spouse
    for (const sId of rootSiblings) {
      const sSpouses = this.getSpouseIds(sId);
      if (sSpouses.includes(targetPersonId)) {
        return isFemale ? 'Sister-in-law' : isMale ? 'Brother-in-law' : 'Sibling-in-law';
      }
    }
    // Child's spouse
    for (const cId of rootChildren) {
      const cSpouses = this.getSpouseIds(cId);
      if (cSpouses.includes(targetPersonId)) {
        return isFemale ? 'Daughter-in-law' : isMale ? 'Son-in-law' : 'Child-in-law';
      }
    }

    // 10. Cousin (child of parent's sibling)
    for (const pId of rootParents) {
      const pSiblings = this.getSiblingIds(pId);
      for (const uncleId of pSiblings) {
        const cousins = this.getChildIds(uncleId);
        if (cousins.includes(targetPersonId)) {
          return 'Cousin';
        }
      }
    }

    return 'Relative';
  }
}

/**
 * Factory helper to construct a FamilyGraph instance.
 */
export function createFamilyGraph(people = [], relationships = []) {
  return new FamilyGraph(people, relationships);
}
