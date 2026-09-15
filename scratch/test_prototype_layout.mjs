import { calculateGenerations } from '../src/utils/familyTreeLayout.js';
import { getParentIds, getChildIds, getSpouseIds } from '../src/utils/relationshipUtils.js';

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 220;
export const SPOUSE_GAP = 40;
export const SIBLING_GAP = 36;
export const FAMILY_UNIT_GAP = 84;
export const GENERATION_HEIGHT = 360;

function getPersonSortKey(person) {
  if (person.birth_date) {
    const timestamp = new Date(person.birth_date).getTime();
    if (!isNaN(timestamp)) return timestamp;
  }
  return (person.first_name || '') + (person.last_name || '');
}

export function buildFamilyTreeLayoutV2(people = [], relationships = []) {
  if (!people || people.length === 0) {
    return { nodes: [], edges: [] };
  }

  const generations = calculateGenerations(people, relationships);

  // Group people by generation
  const tiers = new Map();
  people.forEach((p) => {
    const gen = generations.get(p.id) || 0;
    if (!tiers.has(gen)) tiers.set(gen, []);
    tiers.get(gen).push(p);
  });

  const sortedGens = Array.from(tiers.keys()).sort((a, b) => a - b);
  const positions = new Map();

  // Helper: Build units for a generation tier
  // Handles single individuals, married couples, and multi-spouse individuals cleanly
  function formUnitsForTier(tierMembers) {
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

        let orderedCouple = [p, spouse];
        if (p1Parents.length > 0 && p2Parents.length === 0) {
          orderedCouple = [p, spouse];
        } else if (p2Parents.length > 0 && p1Parents.length === 0) {
          orderedCouple = [spouse, p];
        } else {
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
      } else if (tierSpouses.length > 1) {
        // Multi-spouse group: place focal person between spouses or sequentially
        placed.add(p.id);
        tierSpouses.forEach((s) => placed.add(s.id));

        // Group as: [Spouse1, P, Spouse2, ...]
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

  // 1. Initial Top-Down Pass
  sortedGens.forEach((gen) => {
    const tierMembers = tiers.get(gen);
    const units = formUnitsForTier(tierMembers);

    // Group units into sibling blocks
    const siblingBlocks = new Map();
    units.forEach((unit) => {
      const pKey = unit.parentIds.length > 0
        ? unit.parentIds.slice().sort().join('--')
        : `root--${unit.id}`;

      if (!siblingBlocks.has(pKey)) siblingBlocks.set(pKey, []);
      siblingBlocks.get(pKey).push(unit);
    });

    // Sort siblings chronologically
    siblingBlocks.forEach((blockUnits) => {
      blockUnits.sort((a, b) => {
        if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') {
          return a.sortKey - b.sortKey;
        }
        return String(a.sortKey).localeCompare(String(b.sortKey));
      });
    });

    // Compute target centers for blocks from parents
    const blockList = [];
    siblingBlocks.forEach((blockUnits, pKey) => {
      const blockWidth = blockUnits.reduce((acc, u) => acc + u.width, 0) +
        (blockUnits.length - 1) * SIBLING_GAP;

      let targetCenterX = null;
      const sampleParentIds = blockUnits[0].parentIds;
      if (sampleParentIds.length > 0) {
        const pXs = sampleParentIds.map((id) => positions.get(id)).filter(Boolean);
        if (pXs.length >= 2) {
          const minX = Math.min(...pXs.map((pos) => pos.x));
          const maxX = Math.max(...pXs.map((pos) => pos.x));
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

    // Sort blocks horizontally
    blockList.sort((a, b) => {
      const aVal = a.targetCenterX !== null ? a.targetCenterX : 0;
      const bVal = b.targetCenterX !== null ? b.targetCenterX : 0;
      return aVal - bVal;
    });

    // Place units on this tier without collision
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

  // 2. Upward Pass: Center parents with children directly over children,
  // WITH STRICT COLLISION RESOLUTION ACROSS THE PARENT TIER!
  for (let i = sortedGens.length - 2; i >= 0; i--) {
    const gen = sortedGens[i];
    const tierMembers = tiers.get(gen);
    const units = formUnitsForTier(tierMembers);

    // Calculate ideal centered position for each unit that has children
    units.forEach((unit) => {
      // Find all children belonging to any union in this unit
      const unitPeopleIds = unit.people.map((p) => p.id);
      const allChildrenIds = new Set();

      if (unit.type === 'couple') {
        const [p1, p2] = unit.people;
        const c1 = getChildIds(p1.id, relationships);
        const c2 = getChildIds(p2.id, relationships);
        // Children of both
        c1.filter((id) => c2.includes(id)).forEach((id) => allChildrenIds.add(id));
      } else if (unit.type === 'multi') {
        unitPeopleIds.forEach((pId) => {
          getChildIds(pId, relationships).forEach((cId) => allChildrenIds.add(cId));
        });
      } else {
        getChildIds(unit.people[0].id, relationships).forEach((cId) => allChildrenIds.add(cId));
      }

      const childXs = Array.from(allChildrenIds)
        .map((cId) => positions.get(cId))
        .filter(Boolean);

      if (childXs.length > 0) {
        const minChildX = Math.min(...childXs.map((pos) => pos.x));
        const maxChildX = Math.max(...childXs.map((pos) => pos.x + NODE_WIDTH));
        const childrenMidpoint = (minChildX + maxChildX) / 2;
        unit.idealX = childrenMidpoint - unit.width / 2;
      } else {
        // Keep current X if no children
        const p0Pos = positions.get(unit.people[0].id);
        unit.idealX = p0Pos ? p0Pos.x : 60;
      }
    });

    // Sort units horizontally by idealX
    units.sort((a, b) => a.idealX - b.idealX);

    // Collision-free placement of units on this tier
    let currentX = Math.max(60, units[0].idealX);
    units.forEach((unit, idx) => {
      if (idx > 0) {
        const prev = units[idx - 1];
        const minAllowedX = prev.assignedX + prev.width + FAMILY_UNIT_GAP;
        currentX = Math.max(unit.idealX, minAllowedX);
      } else {
        currentX = Math.max(60, unit.idealX);
      }
      unit.assignedX = currentX;

      // Assign person positions inside the unit
      if (unit.type === 'single') {
        positions.set(unit.people[0].id, { x: currentX, y: gen * GENERATION_HEIGHT });
      } else if (unit.type === 'couple') {
        const [leftPerson, rightPerson] = unit.people;
        positions.set(leftPerson.id, { x: currentX, y: gen * GENERATION_HEIGHT });
        positions.set(rightPerson.id, { x: currentX + NODE_WIDTH + SPOUSE_GAP, y: gen * GENERATION_HEIGHT });
      } else if (unit.type === 'multi') {
        let mX = currentX;
        unit.people.forEach((p) => {
          positions.set(p.id, { x: mX, y: gen * GENERATION_HEIGHT });
          mX += NODE_WIDTH + SPOUSE_GAP;
        });
      }
    });
  }

  // 3. Final Multi-Tier Overlap-Free Guarantee Sweep
  // Ensures for EVERY tier that no two nodes overlap (minimum gap >= 36px)
  sortedGens.forEach((gen) => {
    const tierMembers = tiers.get(gen);
    if (!tierMembers || tierMembers.length <= 1) return;

    // Sort tier members by current x
    const sortedMembers = tierMembers
      .slice()
      .sort((a, b) => {
        const aX = positions.get(a.id)?.x ?? 0;
        const bX = positions.get(b.id)?.x ?? 0;
        return aX - bX;
      });

    // Ensure strictly no overlap: next.x >= prev.x + NODE_WIDTH + minGap
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
        // Shift next and all subsequent nodes in this tier to the right
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

  // 5. Build React Flow Nodes
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

  return { nodes };
}
