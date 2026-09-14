import dagre from 'dagre';
import { getParentIds, getChildIds, getSpouseIds } from './relationshipUtils';

export const NODE_WIDTH = 185;
export const NODE_HEIGHT = 220;
export const SPOUSE_GAP = 50;
export const SIBLING_GAP = 40;
export const FAMILY_UNIT_GAP = 90;
export const GENERATION_HEIGHT = 300;

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
 * Returns average parent center X for a person, or null if no parents placed yet.
 */
function getParentCenterX(personId, relationships, positions) {
  const parentIds = getParentIds(personId, relationships);
  const xs = parentIds
    .map((pId) => positions.get(pId)?.x)
    .filter((x) => x !== undefined);
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * Automatically computes hierarchical layout coordinates for portrait pedigree cards
 * and orthogonal T-junction connectors.
 */
export function buildFamilyTreeLayout(people = [], relationships = []) {
  if (!people || people.length === 0) {
    return { nodes: [], edges: [] };
  }

  const generations = calculateGenerations(people, relationships);

  // 1. Initial Dagre pass to compute relative horizontal ordering
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 50,
    ranksep: 120,
    edgesep: 30,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  people.forEach((p) => {
    g.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  relationships
    .filter((r) => r.relationship_type === 'parent')
    .forEach((r) => {
      g.setEdge(r.person_1_id, r.person_2_id);
    });

  relationships
    .filter((r) => r.relationship_type === 'spouse')
    .forEach((r) => {
      const p1Children = getChildIds(r.person_1_id, relationships);
      const p2Children = getChildIds(r.person_2_id, relationships);
      p1Children.forEach((cId) => {
        if (!g.hasEdge(r.person_2_id, cId)) g.setEdge(r.person_2_id, cId);
      });
      p2Children.forEach((cId) => {
        if (!g.hasEdge(r.person_1_id, cId)) g.setEdge(r.person_1_id, cId);
      });
    });

  try {
    dagre.layout(g);
  } catch (err) {
    console.warn('Dagre layout notice:', err);
  }

  // 2. Group people into generational tiers
  const tiers = new Map();
  people.forEach((p) => {
    const gen = generations.get(p.id) || 0;
    if (!tiers.has(gen)) tiers.set(gen, []);
    const dNode = g.node(p.id);
    tiers.get(gen).push({
      person: p,
      dagreX: dNode ? dNode.x : 0,
    });
  });

  // 3. Lay out each tier from top generation to bottom generation
  const positions = new Map();
  const sortedGens = Array.from(tiers.keys()).sort((a, b) => a - b);

  sortedGens.forEach((gen) => {
    const tierMembers = tiers.get(gen);
    const placed = new Set();
    const units = [];

    // Form units: couples or single individuals
    tierMembers.forEach((item) => {
      if (placed.has(item.person.id)) return;
      placed.add(item.person.id);

      const spouseIds = getSpouseIds(item.person.id, relationships);
      const spouseItem = tierMembers.find(
        (m) => spouseIds.includes(m.person.id) && !placed.has(m.person.id)
      );

      if (spouseItem) {
        placed.add(spouseItem.person.id);
        const p1 = item.person;
        const p2 = spouseItem.person;

        const p1ParentX = getParentCenterX(p1.id, relationships, positions);
        const p2ParentX = getParentCenterX(p2.id, relationships, positions);

        let orderedCouple = [p1, p2];

        if (p1ParentX !== null && p2ParentX !== null) {
          // Both have parents: place the one whose parents are further left on the left!
          orderedCouple = p1ParentX <= p2ParentX ? [p1, p2] : [p2, p1];
        } else if (p1ParentX !== null && p2ParentX === null) {
          // p1 is biological child, p2 is in-law
          // If p1's parents are further left, place [p1, p2]; if further right, place [p2, p1]
          orderedCouple = [p1, p2];
        } else if (p2ParentX !== null && p1ParentX === null) {
          // p2 is biological child, p1 is in-law
          orderedCouple = [p1, p2];
        } else {
          // Neither has parents in the tree (e.g. Gen 0): sort by Dagre X
          orderedCouple = item.dagreX <= spouseItem.dagreX ? [p1, p2] : [p2, p1];
        }

        // Calculate unit target center X
        let targetX = null;
        if (p1ParentX !== null && p2ParentX !== null) {
          targetX = (p1ParentX + p2ParentX) / 2;
        } else if (p1ParentX !== null) {
          targetX = p1ParentX;
        } else if (p2ParentX !== null) {
          targetX = p2ParentX;
        } else {
          targetX = (item.dagreX + spouseItem.dagreX) / 2;
        }

        units.push({
          type: 'couple',
          people: orderedCouple,
          targetX,
          dagreX: (item.dagreX + spouseItem.dagreX) / 2,
        });
      } else {
        // Single individual unit
        const parentX = getParentCenterX(item.person.id, relationships, positions);
        units.push({
          type: 'single',
          people: [item.person],
          targetX: parentX !== null ? parentX : item.dagreX,
          dagreX: item.dagreX,
        });
      }
    });

    // Sort units horizontally by their target position
    units.sort((a, b) => {
      const aVal = a.targetX !== null ? a.targetX : a.dagreX;
      const bVal = b.targetX !== null ? b.targetX : b.dagreX;
      return aVal - bVal;
    });

    // Space out units with collision prevention
    let curX = 40;
    units.forEach((unit) => {
      const unitWidth =
        unit.type === 'couple' ? NODE_WIDTH * 2 + SPOUSE_GAP : NODE_WIDTH;
      const idealX = unit.targetX !== null ? unit.targetX - unitWidth / 2 : curX;
      const startX = Math.max(idealX, curX);

      if (unit.type === 'single') {
        positions.set(unit.people[0].id, {
          x: startX,
          y: gen * GENERATION_HEIGHT,
        });
        curX = startX + NODE_WIDTH + SIBLING_GAP;
      } else {
        const [leftPerson, rightPerson] = unit.people;
        positions.set(leftPerson.id, {
          x: startX,
          y: gen * GENERATION_HEIGHT,
        });
        const rightX = startX + NODE_WIDTH + SPOUSE_GAP;
        positions.set(rightPerson.id, {
          x: rightX,
          y: gen * GENERATION_HEIGHT,
        });
        curX = rightX + NODE_WIDTH + FAMILY_UNIT_GAP;
      }
    });
  });

  // 4. Normalize minimum X to 40
  let minX = Infinity;
  positions.forEach((pos) => {
    if (pos.x < minX) minX = pos.x;
  });
  if (minX !== Infinity && minX < 40) {
    const shift = 40 - minX;
    positions.forEach((pos) => {
      pos.x += shift;
    });
  }

  // 5. Build Person Nodes
  const nodes = people.map((person) => {
    const pos = positions.get(person.id) || { x: 0, y: 0 };
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

  // 6. Build Orthogonal T-Junctions & Edges
  const edges = [];
  const processedSpousePairs = new Set();
  const processedParentChildPairs = new Set();

  // A. Group children by parental pairs to form Marriage Unions
  const parentPairs = new Map(); // key: pairKey -> Set of childIds

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
  // 1. Create horizontal marriage line between spouses
  // 2. If they have children, create union node and drop orthogonal branch lines with arrows
  parentPairs.forEach((union, pairKey) => {
    const pos1 = positions.get(union.parent1Id);
    const pos2 = positions.get(union.parent2Id);
    if (!pos1 || !pos2) return;

    // Determine left and right spouse
    const leftId = pos1.x <= pos2.x ? union.parent1Id : union.parent2Id;
    const rightId = pos1.x <= pos2.x ? union.parent2Id : union.parent1Id;
    const leftPos = pos1.x <= pos2.x ? pos1 : pos2;
    const rightPos = pos1.x <= pos2.x ? pos2 : pos1;

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

    // If couple has children, create dynamic orthogonal branch lines directly from the relation path!
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
            stroke: '#94a3b8',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#94a3b8',
            width: 12,
            height: 12,
          },
        });
      });
    }
  });

  // D. For single parents with children (not covered by a couple union)
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
            stroke: '#94a3b8',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#94a3b8',
            width: 12,
            height: 12,
          },
        });
      }
    });

  return { nodes, edges };
}
