import dagre from 'dagre';
import { getParentIds, getChildIds, getSpouseIds } from './relationshipUtils.js';

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 220;
export const SPOUSE_GAP = 40;
export const SIBLING_GAP = 36;
export const FAMILY_UNIT_GAP = 84;
export const GENERATION_HEIGHT = 360;

/**
 * Calculates strict generational levels for every person in the tree.
 * Roots (people with no parents in this tree and not married to a descendant) start at level 0.
 * In-law spouses inherit their spouse's generation level.
 * Children are placed at max(parents) + 1.
 */
export function calculateGenerations(people = [], relationships = []) {
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

  // Iteratively propagate generations down through children and synchronize spouses
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

    // 2. Spouse <-> Spouse (sync on same generation)
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
  }

  // Fallback for any disconnected lone nodes
  people.forEach((p) => {
    if (!gens.has(p.id)) {
      gens.set(p.id, 0);
    }
  });

  return gens;
}

/**
 * Returns birth timestamp for ordering siblings chronologically, or 0 if none.
 */
function getPersonSortKey(person) {
  if (person.birth_date) {
    const timestamp = new Date(person.birth_date).getTime();
    if (!isNaN(timestamp)) return timestamp;
  }
  return (person.first_name || '') + (person.last_name || '');
}

/**
 * Automatically computes hierarchical layout coordinates for pedigree cards
 * with sibling block centering, chronological ordering, and orthogonal connectors.
 */
export function buildFamilyTreeLayout(people = [], relationships = []) {
  if (!people || people.length === 0) {
    return { nodes: [], edges: [] };
  }

  const generations = calculateGenerations(people, relationships);

  // Group people into generational tiers
  const tiers = new Map();
  people.forEach((p) => {
    const gen = generations.get(p.id) || 0;
    if (!tiers.has(gen)) tiers.set(gen, []);
    tiers.get(gen).push(p);
  });

  const positions = new Map();
  const sortedGens = Array.from(tiers.keys()).sort((a, b) => a - b);

  // 1. Initial Top-Down Placement
  sortedGens.forEach((gen) => {
    const tierMembers = tiers.get(gen);
    const placed = new Set();
    const units = [];

    // A. Form Units: Married Couples or Single Individuals
    tierMembers.forEach((p) => {
      if (placed.has(p.id)) return;
      placed.add(p.id);

      const spouseIds = getSpouseIds(p.id, relationships);
      const spouse = tierMembers.find((m) => spouseIds.includes(m.id) && !placed.has(m.id));

      if (spouse) {
        placed.add(spouse.id);

        // Determine left vs right in the couple:
        // If one person is biological child of parents above, keep consistent or chronological order
        const p1Parents = getParentIds(p.id, relationships);
        const p2Parents = getParentIds(spouse.id, relationships);

        let orderedCouple = [p, spouse];
        if (p1Parents.length > 0 && p2Parents.length === 0) {
          orderedCouple = [p, spouse];
        } else if (p2Parents.length > 0 && p1Parents.length === 0) {
          orderedCouple = [spouse, p];
        } else {
          // Consistent gender ordering (Male left, Female right) or chronological
          if (p.gender === 'Female' && spouse.gender === 'Male') {
            orderedCouple = [spouse, p];
          } else {
            orderedCouple = [p, spouse];
          }
        }

        const bioPerson = p2Parents.length > 0 && p1Parents.length === 0 ? spouse : p;
        units.push({
          id: `couple-${p.id}-${spouse.id}`,
          type: 'couple',
          people: orderedCouple,
          bioPerson,
          parentIds: getParentIds(bioPerson.id, relationships),
          width: NODE_WIDTH * 2 + SPOUSE_GAP,
          sortKey: getPersonSortKey(bioPerson),
        });
      } else {
        units.push({
          id: `single-${p.id}`,
          type: 'single',
          people: [p],
          bioPerson: p,
          parentIds: getParentIds(p.id, relationships),
          width: NODE_WIDTH,
          sortKey: getPersonSortKey(p),
        });
      }
    });

    // B. Group Units into Sibling Blocks (units that share the exact same parents)
    const siblingBlocks = new Map(); // key -> list of units
    units.forEach((unit) => {
      const pKey = unit.parentIds.length > 0
        ? unit.parentIds.slice().sort().join('--')
        : `root--${unit.id}`;

      if (!siblingBlocks.has(pKey)) {
        siblingBlocks.set(pKey, []);
      }
      siblingBlocks.get(pKey).push(unit);
    });

    // C. Sort siblings chronologically (order / hierarchy) within each sibling block
    siblingBlocks.forEach((blockUnits) => {
      blockUnits.sort((a, b) => {
        if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') {
          return a.sortKey - b.sortKey;
        }
        return String(a.sortKey).localeCompare(String(b.sortKey));
      });
    });

    // D. Compute Block Target Positions and Center Sibling Blocks
    const blockList = [];
    siblingBlocks.forEach((blockUnits, pKey) => {
      const blockWidth = blockUnits.reduce((acc, u) => acc + u.width, 0) +
        (blockUnits.length - 1) * SIBLING_GAP;

      // Determine target center X from parents in previous tier
      let targetCenterX = null;
      const sampleParentIds = blockUnits[0].parentIds;
      if (sampleParentIds.length > 0) {
        const pXs = sampleParentIds
          .map((id) => positions.get(id))
          .filter(Boolean);

        if (pXs.length === 2) {
          // Midpoint between both parents
          const minX = Math.min(pXs[0].x, pXs[1].x);
          const maxX = Math.max(pXs[0].x, pXs[1].x);
          targetCenterX = (minX + maxX + NODE_WIDTH) / 2;
        } else if (pXs.length === 1) {
          targetCenterX = pXs[0].x + NODE_WIDTH / 2;
        }
      }

      blockList.push({
        pKey,
        units: blockUnits,
        width: blockWidth,
        targetCenterX,
      });
    });

    // Sort sibling blocks horizontally by target position
    blockList.sort((a, b) => {
      const aVal = a.targetCenterX !== null ? a.targetCenterX : 0;
      const bVal = b.targetCenterX !== null ? b.targetCenterX : 0;
      return aVal - bVal;
    });

    // E. Space out sibling blocks and place cards horizontally with collision resolution
    let curX = 60;
    blockList.forEach((block) => {
      const idealStartX = block.targetCenterX !== null
        ? block.targetCenterX - block.width / 2
        : curX;

      const blockStartX = Math.max(idealStartX, curX);

      // Place each unit within the block sequentially
      let unitX = blockStartX;
      block.units.forEach((unit) => {
        if (unit.type === 'single') {
          positions.set(unit.people[0].id, {
            x: unitX,
            y: gen * GENERATION_HEIGHT,
          });
          unitX += NODE_WIDTH + SIBLING_GAP;
        } else {
          const [leftPerson, rightPerson] = unit.people;
          positions.set(leftPerson.id, {
            x: unitX,
            y: gen * GENERATION_HEIGHT,
          });
          const rightX = unitX + NODE_WIDTH + SPOUSE_GAP;
          positions.set(rightPerson.id, {
            x: rightX,
            y: gen * GENERATION_HEIGHT,
          });
          unitX += unit.width + SIBLING_GAP;
        }
      });

      curX = blockStartX + block.width + FAMILY_UNIT_GAP;
    });
  });

  // 2. Upward Pass: Center parents with children directly over their children's midpoint
  // (Crucial for Gen 0 root couples like George & Mary / Venugopalan & Mayarani)
  for (let i = sortedGens.length - 2; i >= 0; i--) {
    const gen = sortedGens[i];
    const tierMembers = tiers.get(gen);

    tierMembers.forEach((person) => {
      const spouseIds = getSpouseIds(person.id, relationships);
      const spouse = tierMembers.find((m) => spouseIds.includes(m.id));

      // Check if this couple has children
      const pChildren = getChildIds(person.id, relationships);
      const sChildren = spouse ? getChildIds(spouse.id, relationships) : [];
      const childrenIds = spouse
        ? pChildren.filter((cId) => sChildren.includes(cId))
        : pChildren;

      if (childrenIds.length > 0) {
        const childXs = childrenIds
          .map((cId) => positions.get(cId))
          .filter(Boolean);

        if (childXs.length > 0) {
          const minChildX = Math.min(...childXs.map((p) => p.x));
          const maxChildX = Math.max(...childXs.map((p) => p.x + NODE_WIDTH));
          const childrenMidpoint = (minChildX + maxChildX) / 2;

          const pPos = positions.get(person.id);
          const sPos = spouse ? positions.get(spouse.id) : null;

          if (spouse && pPos && sPos) {
            const coupleWidth = NODE_WIDTH * 2 + SPOUSE_GAP;
            const newLeftX = childrenMidpoint - coupleWidth / 2;
            const leftPerson = pPos.x <= sPos.x ? person : spouse;
            const rightPerson = pPos.x <= sPos.x ? spouse : person;

            positions.set(leftPerson.id, { x: newLeftX, y: gen * GENERATION_HEIGHT });
            positions.set(rightPerson.id, {
              x: newLeftX + NODE_WIDTH + SPOUSE_GAP,
              y: gen * GENERATION_HEIGHT,
            });
          } else if (pPos && !spouse) {
            positions.set(person.id, {
              x: childrenMidpoint - NODE_WIDTH / 2,
              y: gen * GENERATION_HEIGHT,
            });
          }
        }
      }
    });
  }

  // 3. Normalize minimum X to at least 60px padding
  let minX = Infinity;
  positions.forEach((pos) => {
    if (pos.x < minX) minX = pos.x;
  });
  if (minX !== Infinity && minX < 60) {
    const shift = 60 - minX;
    positions.forEach((pos) => {
      pos.x += shift;
    });
  }

  // 4. Build React Flow Nodes
  const nodes = people.map((person) => {
    const pos = positions.get(person.id) || { x: 60, y: 0 };
    return {
      id: person.id,
      type: 'personNode',
      position: { x: pos.x, y: pos.y },
      data: {
        person,
        generation: generations.get(person.id) || 0,
        relationships,
      },
    };
  });

  // 5. Build Orthogonal T-Junctions & Edges
  const edges = [];
  const processedSpousePairs = new Set();
  const processedParentChildPairs = new Set();

  // A. Group children by parental pairs to form Marriage Unions
  const parentPairs = new Map();

  relationships
    .filter((r) => r.relationship_type === 'parent')
    .forEach((rel) => {
      const childId = rel.person_2_id;
      const parentIds = getParentIds(childId, relationships);

      if (parentIds.length >= 2) {
        const pairKey = [parentIds[0], parentIds[1]].sort().join('--');
        if (!parentPairs.has(pairKey)) {
          parentPairs.set(pairKey, {
            parent1Id: parentIds[0],
            parent2Id: parentIds[1],
            children: new Set(),
          });
        }
        parentPairs.get(pairKey).children.add(childId);
        processedParentChildPairs.add(`${rel.person_1_id}->${childId}`);
      }
    });

  // B. Also include married couples that may not have shared children yet
  relationships
    .filter((r) => r.relationship_type === 'spouse')
    .forEach((rel) => {
      const pairKey = [rel.person_1_id, rel.person_2_id].sort().join('--');
      if (!parentPairs.has(pairKey)) {
        const p1Children = getChildIds(rel.person_1_id, relationships);
        const p2Children = getChildIds(rel.person_2_id, relationships);
        const shared = p1Children.filter((cId) => p2Children.includes(cId));
        parentPairs.set(pairKey, {
          parent1Id: rel.person_1_id,
          parent2Id: rel.person_2_id,
          children: new Set(shared),
        });
      }
    });

  // C. For each family union (couple):
  parentPairs.forEach((union, pairKey) => {
    const pos1 = positions.get(union.parent1Id);
    const pos2 = positions.get(union.parent2Id);
    if (!pos1 || !pos2) return;

    const leftId = pos1.x <= pos2.x ? union.parent1Id : union.parent2Id;
    const rightId = pos1.x <= pos2.x ? union.parent2Id : union.parent1Id;

    // Horizontal Marriage Edge
    if (!processedSpousePairs.has(pairKey)) {
      processedSpousePairs.add(pairKey);
      edges.push({
        id: `rel-spouse-${pairKey}`,
        source: leftId,
        target: rightId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'spouseEdge',
        style: {
          stroke: '#cbd5e1',
          strokeWidth: 2,
        },
      });
    }

    // Branch lines from the relation path down to each child
    const childIds = Array.from(union.children);
    if (childIds.length > 0) {
      childIds.forEach((childId) => {
        edges.push({
          id: `edge-branch-${pairKey}-to-${childId}`,
          source: leftId,
          target: childId,
          sourceHandle: 'right',
          targetHandle: 'top',
          type: 'familyBranchEdge',
          data: {
            otherParentId: rightId,
          },
          style: {
            stroke: '#0d9488',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#0d9488',
            width: 10,
            height: 10,
          },
        });
      });
    }
  });

  // D. For single parents with children
  relationships
    .filter((r) => r.relationship_type === 'parent')
    .forEach((rel) => {
      const key = `${rel.person_1_id}->${rel.person_2_id}`;
      if (!processedParentChildPairs.has(key)) {
        edges.push({
          id: `rel-single-${rel.id}`,
          source: rel.person_1_id,
          target: rel.person_2_id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'familyBranchEdge',
          data: {},
          style: {
            stroke: '#0d9488',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#0d9488',
            width: 10,
            height: 10,
          },
        });
      }
    });

  return { nodes, edges };
}
