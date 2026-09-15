import { getParentIds, getChildIds, getSpouseIds, getSiblingIds } from '../src/utils/relationshipUtils.js';

function calculateGenerationsFixed(people = [], relationships = []) {
  const gens = new Map();
  const hasParents = new Set(
    relationships.filter((r) => r.relationship_type === 'parent').map((r) => r.person_2_id)
  );

  // Identify in-laws: people with no parents of their own who are married to someone who HAS parents
  const inLaws = new Set();
  relationships
    .filter((r) => r.relationship_type === 'spouse')
    .forEach((r) => {
      if (hasParents.has(r.person_1_id) && !hasParents.has(r.person_2_id)) {
        inLaws.add(r.person_2_id);
      }
      if (hasParents.has(r.person_2_id) && !hasParents.has(r.person_1_id)) {
        inLaws.add(r.person_1_id);
      }
    });

  // Biological roots start at generation 0
  people.forEach((p) => {
    if (!hasParents.has(p.id) && !inLaws.has(p.id)) {
      gens.set(p.id, 0);
    }
  });

  // Iteratively propagate generations down through children, sync spouses & siblings, and align parents
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 50) {
    changed = false;
    iterations++;

    // 1. Parent -> Child
    relationships
      .filter((r) => r.relationship_type === 'parent')
      .forEach((r) => {
        const parentGen = gens.get(r.person_1_id);
        if (parentGen !== undefined) {
          const currentChildGen = gens.get(r.person_2_id);
          const nextChildGen = parentGen + 1;
          if (currentChildGen === undefined || nextChildGen > currentChildGen) {
            gens.set(r.person_2_id, nextChildGen);
            changed = true;
          }
        }
      });

    // 2. Spouse <-> Spouse (Strictly same generation)
    relationships
      .filter((r) => r.relationship_type === 'spouse')
      .forEach((r) => {
        const g1 = gens.get(r.person_1_id);
        const g2 = gens.get(r.person_2_id);
        if (g1 !== undefined && g2 === undefined) {
          gens.set(r.person_2_id, g1);
          changed = true;
        } else if (g2 !== undefined && g1 === undefined) {
          gens.set(r.person_1_id, g2);
          changed = true;
        } else if (g1 !== undefined && g2 !== undefined && g1 !== g2) {
          const maxG = Math.max(g1, g2);
          gens.set(r.person_1_id, maxG);
          gens.set(r.person_2_id, maxG);
          changed = true;
        }
      });

    // 3. Sibling <-> Sibling (Strictly same generation)
    people.forEach((p) => {
      const pGen = gens.get(p.id);
      if (pGen === undefined) return;
      const sibIds = getSiblingIds(p.id, relationships);
      sibIds.forEach((sId) => {
        const sGen = gens.get(sId);
        if (sGen === undefined) {
          gens.set(sId, pGen);
          changed = true;
        } else if (pGen !== sGen) {
          const maxG = Math.max(pGen, sGen);
          gens.set(p.id, maxG);
          gens.set(sId, maxG);
          changed = true;
        }
      });
    });

    // 4. Child -> Parent: Parents must be at least childGen - 1
    relationships
      .filter((r) => r.relationship_type === 'parent')
      .forEach((r) => {
        const childGen = gens.get(r.person_2_id);
        if (childGen !== undefined) {
          const parentGen = gens.get(r.person_1_id);
          const minParentGen = childGen - 1;
          if (parentGen === undefined || parentGen < minParentGen) {
            gens.set(r.person_1_id, minParentGen);
            changed = true;
          }
        }
      });
  }

  // Fallback for any disconnected lone nodes
  people.forEach((p) => {
    if (!gens.has(p.id)) {
      gens.set(p.id, 0);
    }
  });

  return gens;
}

const people1 = [
  { id: 'george', first_name: 'George', birth_date: '1920-01-01' },
  { id: 'mary', first_name: 'Mary', birth_date: '1924-01-01' },
  { id: 'robert', first_name: 'Robert', birth_date: '1952-01-01' },
  { id: 'michael', first_name: 'Michael', birth_date: '1958-01-01' },
  { id: 'anna_gpa', first_name: 'AnnaGpa', birth_date: '1895-01-01' },
  { id: 'anna_dad', first_name: 'AnnaDad', birth_date: '1925-01-01' },
  { id: 'anna', first_name: 'Anna', birth_date: '1955-01-01' },
];

const rels1 = [
  { person_1_id: 'george', person_2_id: 'mary', relationship_type: 'spouse' },
  { person_1_id: 'george', person_2_id: 'robert', relationship_type: 'parent' },
  { person_1_id: 'mary', person_2_id: 'robert', relationship_type: 'parent' },
  { person_1_id: 'george', person_2_id: 'michael', relationship_type: 'parent' },
  { person_1_id: 'mary', person_2_id: 'michael', relationship_type: 'parent' },

  { person_1_id: 'anna_gpa', person_2_id: 'anna_dad', relationship_type: 'parent' },
  { person_1_id: 'anna_dad', person_2_id: 'anna', relationship_type: 'parent' },

  { person_1_id: 'robert', person_2_id: 'anna', relationship_type: 'spouse' },
];

const gens = calculateGenerationsFixed(people1, rels1);
console.log('AnnaGpa:', gens.get('anna_gpa'));
console.log('AnnaDad:', gens.get('anna_dad'));
console.log('George:', gens.get('george'));
console.log('Mary:', gens.get('mary'));
console.log('Robert:', gens.get('robert'));
console.log('Anna:', gens.get('anna'));
console.log('Michael:', gens.get('michael'));
