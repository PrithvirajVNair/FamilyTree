import { NODE_WIDTH, NODE_HEIGHT, SPOUSE_GAP, SIBLING_GAP, FAMILY_UNIT_GAP, GENERATION_HEIGHT } from '../src/utils/familyTreeLayout.js';
import { getParentIds, getChildIds, getSpouseIds, getSiblingIds } from '../src/utils/relationshipUtils.js';

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

  // Iteratively propagate generations down through children and synchronize spouses & siblings
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

    // 4. Child -> Parent: If child was pushed down, align parent at least childGen - 1
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

function getPersonSortKey(person) {
  if (person.birth_date) {
    const timestamp = new Date(person.birth_date).getTime();
    if (!isNaN(timestamp)) return timestamp;
  }
  return (person.first_name || '') + (person.last_name || '');
}

function formUnitsForTier(tierMembers, relationships) {
  const placed = new Set();
  const units = [];

  tierMembers.forEach((p) => {
    if (placed.has(p.id)) return;

    const spouseIds = getSpouseIds(p.id, relationships);
    const tierSpouses = tierMembers.filter((m) => spouseIds.includes(m.id) && !placed.has(m.id));

    if (tierSpouses.length === 1) {
      const spouse = tierSpouses[0];
      placed.add(p.id);
      placed.add(spouse.id);

      const p1Parents = getParentIds(p.id, relationships);
      const p2Parents = getParentIds(spouse.id, relationships);
      const p1Siblings = getSiblingIds(p.id, relationships);
      const p2Siblings = getSiblingIds(spouse.id, relationships);

      // Determine who is the biological anchor sibling
      let bioPerson = p;
      if (p2Parents.length > 0 && p1Parents.length === 0) {
        bioPerson = spouse;
      } else if (p1Parents.length > 0 && p2Parents.length === 0) {
        bioPerson = p;
      } else if (p2Siblings.length > 0 && p1Siblings.length === 0) {
        bioPerson = spouse;
      } else if (p1Siblings.length > 0 && p2Siblings.length === 0) {
        bioPerson = p;
      } else {
        bioPerson = p;
      }

      let orderedCouple = [p, spouse];
      if (bioPerson.id === spouse.id) {
        orderedCouple = [spouse, p];
      } else {
        orderedCouple = [p, spouse];
      }

      units.push({
        id: `couple-${p.id}-${spouse.id}`,
        type: 'couple',
        people: orderedCouple,
        bioPerson,
        parentIds: getParentIds(bioPerson.id, relationships),
        width: NODE_WIDTH * 2 + SPOUSE_GAP,
        sortKey: getPersonSortKey(bioPerson),
      });
    } else if (tierSpouses.length > 1) {
      placed.add(p.id);
      tierSpouses.forEach((s) => placed.add(s.id));

      const groupPeople = [tierSpouses[0], p, ...tierSpouses.slice(1)];
      const totalWidth = groupPeople.length * NODE_WIDTH + (groupPeople.length - 1) * SPOUSE_GAP;

      units.push({
        id: `multi-${p.id}`,
        type: 'multi',
        people: groupPeople,
        bioPerson: p,
        parentIds: getParentIds(p.id, relationships),
        width: totalWidth,
        sortKey: getPersonSortKey(p),
      });
    } else {
      placed.add(p.id);
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

  return units;
}

function groupUnitsIntoSiblingBlocks(units) {
  const siblingBlocks = new Map();
  units.forEach((unit) => {
    const pKey = unit.parentIds && unit.parentIds.length > 0
      ? unit.parentIds.slice().sort().join('--')
      : `root--${unit.id}`;

    if (!siblingBlocks.has(pKey)) {
      siblingBlocks.set(pKey, {
        pKey,
        units: [],
        parentIds: unit.parentIds || [],
      });
    }
    siblingBlocks.get(pKey).units.push(unit);
  });

  // Sort siblings chronologically within each sibling block
  siblingBlocks.forEach((block) => {
    block.units.sort((a, b) => {
      if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') {
        return a.sortKey - b.sortKey;
      }
      return String(a.sortKey).localeCompare(String(b.sortKey));
    });

    block.width = block.units.reduce((acc, u) => acc + u.width, 0) +
      (block.units.length - 1) * SIBLING_GAP;
  });

  return Array.from(siblingBlocks.values());
}

export function buildFamilyTreeLayoutV3(people = [], relationships = []) {
  if (!people || people.length === 0) {
    return { nodes: [], edges: [] };
  }

  const generations = calculateGenerations(people, relationships);

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
    const units = formUnitsForTier(tierMembers, relationships);
    const blockList = groupUnitsIntoSiblingBlocks(units);

    // Compute target center X from parents in previous tier
    blockList.forEach((block) => {
      let targetCenterX = null;
      if (block.parentIds.length > 0) {
        const pXs = block.parentIds.map((id) => positions.get(id)).filter(Boolean);
        if (pXs.length >= 2) {
          const minX = Math.min(...pXs.map((pos) => pos.x));
          const maxX = Math.max(...pXs.map((pos) => pos.x));
          targetCenterX = (minX + maxX + NODE_WIDTH) / 2;
        } else if (pXs.length === 1) {
          targetCenterX = pXs[0].x + NODE_WIDTH / 2;
        }
      }
      block.targetCenterX = targetCenterX;
    });

    // Sort sibling blocks horizontally by target position
    blockList.sort((a, b) => {
      const aVal = a.targetCenterX !== null ? a.targetCenterX : 0;
      const bVal = b.targetCenterX !== null ? b.targetCenterX : 0;
      return aVal - bVal;
    });

    // Space out sibling blocks and place cards horizontally
    let curX = 60;
    blockList.forEach((block) => {
      const idealStartX = block.targetCenterX !== null
        ? block.targetCenterX - block.width / 2
        : curX;

      const blockStartX = Math.max(idealStartX, curX);
      let unitX = blockStartX;

      block.units.forEach((unit) => {
        if (unit.type === 'single') {
          positions.set(unit.people[0].id, { x: unitX, y: gen * GENERATION_HEIGHT });
          unitX += NODE_WIDTH + SIBLING_GAP;
        } else if (unit.type === 'couple') {
          const [leftPerson, rightPerson] = unit.people;
          positions.set(leftPerson.id, { x: unitX, y: gen * GENERATION_HEIGHT });
          positions.set(rightPerson.id, { x: unitX + NODE_WIDTH + SPOUSE_GAP, y: gen * GENERATION_HEIGHT });
          unitX += unit.width + SIBLING_GAP;
        } else if (unit.type === 'multi') {
          let mX = unitX;
          unit.people.forEach((p) => {
            positions.set(p.id, { x: mX, y: gen * GENERATION_HEIGHT });
            mX += NODE_WIDTH + SPOUSE_GAP;
          });
          unitX += unit.width + SIBLING_GAP;
        }
      });

      curX = blockStartX + block.width + FAMILY_UNIT_GAP;
    });
  });

  // 2. Upward Pass: Center Sibling Blocks over their collective children while PRESERVING chronological sibling order
  for (let i = sortedGens.length - 2; i >= 0; i--) {
    const gen = sortedGens[i];
    const tierMembers = tiers.get(gen);
    const units = formUnitsForTier(tierMembers, relationships);
    const siblingBlocks = groupUnitsIntoSiblingBlocks(units);

    siblingBlocks.forEach((block) => {
      const allChildrenIds = new Set();
      block.units.forEach((unit) => {
        if (unit.type === 'couple') {
          const [p1, p2] = unit.people;
          const c1 = getChildIds(p1.id, relationships);
          const c2 = getChildIds(p2.id, relationships);
          c1.filter((id) => c2.includes(id)).forEach((id) => allChildrenIds.add(id));
        } else if (unit.type === 'multi') {
          unit.people.forEach((p) => {
            getChildIds(p.id, relationships).forEach((cId) => allChildrenIds.add(cId));
          });
        } else {
          getChildIds(unit.people[0].id, relationships).forEach((cId) => allChildrenIds.add(cId));
        }
      });

      const childXs = Array.from(allChildrenIds)
        .map((cId) => positions.get(cId))
        .filter(Boolean);

      if (childXs.length > 0) {
        const minChildX = Math.min(...childXs.map((pos) => pos.x));
        const maxChildX = Math.max(...childXs.map((pos) => pos.x + NODE_WIDTH));
        const childrenMidpoint = (minChildX + maxChildX) / 2;
        block.idealX = childrenMidpoint - block.width / 2;
      } else {
        const currentXs = block.units
          .flatMap((u) => u.people)
          .map((p) => positions.get(p.id)?.x)
          .filter((x) => x !== undefined);
        block.idealX = currentXs.length > 0 ? Math.min(...currentXs) : 60;
      }
    });

    siblingBlocks.sort((a, b) => a.idealX - b.idealX);

    let currentX = Math.max(60, siblingBlocks[0].idealX);
    siblingBlocks.forEach((block, bIdx) => {
      if (bIdx > 0) {
        const prevBlock = siblingBlocks[bIdx - 1];
        const minAllowedX = prevBlock.assignedEndX + FAMILY_UNIT_GAP;
        currentX = Math.max(block.idealX, minAllowedX);
      } else {
        currentX = Math.max(60, block.idealX);
      }

      block.assignedStartX = currentX;
      let unitX = currentX;

      block.units.forEach((unit) => {
        if (unit.type === 'single') {
          positions.set(unit.people[0].id, { x: unitX, y: gen * GENERATION_HEIGHT });
          unitX += NODE_WIDTH + SIBLING_GAP;
        } else if (unit.type === 'couple') {
          const [leftPerson, rightPerson] = unit.people;
          positions.set(leftPerson.id, { x: unitX, y: gen * GENERATION_HEIGHT });
          positions.set(rightPerson.id, { x: unitX + NODE_WIDTH + SPOUSE_GAP, y: gen * GENERATION_HEIGHT });
          unitX += unit.width + SIBLING_GAP;
        } else if (unit.type === 'multi') {
          let mX = unitX;
          unit.people.forEach((p) => {
            positions.set(p.id, { x: mX, y: gen * GENERATION_HEIGHT });
            mX += NODE_WIDTH + SPOUSE_GAP;
          });
          unitX += unit.width + SIBLING_GAP;
        }
      });

      block.assignedEndX = unitX - SIBLING_GAP;
      currentX = block.assignedEndX;
    });
  }

  // 3. Final Multi-Tier Overlap-Free Guarantee Sweep
  sortedGens.forEach((gen) => {
    const tierMembers = tiers.get(gen);
    if (!tierMembers || tierMembers.length <= 1) return;

    const sortedMembers = tierMembers
      .slice()
      .sort((a, b) => {
        const aX = positions.get(a.id)?.x ?? 0;
        const bX = positions.get(b.id)?.x ?? 0;
        return aX - bX;
      });

    for (let m = 0; m < sortedMembers.length - 1; m++) {
      const prev = sortedMembers[m];
      const next = sortedMembers[m + 1];
      const prevPos = positions.get(prev.id);
      const nextPos = positions.get(next.id);

      if (!prevPos || !nextPos) continue;

      const isSpouse = getSpouseIds(prev.id, relationships).includes(next.id);
      const minGap = isSpouse ? SPOUSE_GAP : SIBLING_GAP;
      const minNextX = prevPos.x + NODE_WIDTH + minGap;

      if (nextPos.x < minNextX) {
        const shift = minNextX - nextPos.x;
        for (let k = m + 1; k < sortedMembers.length; k++) {
          const kPos = positions.get(sortedMembers[k].id);
          if (kPos) kPos.x += shift;
        }
      }
    }
  });

  // 4. Normalize minimum X to at least 60px padding
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

  // Build nodes
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

  return { nodes, edges: [] };
}
