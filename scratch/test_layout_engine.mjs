import { buildFamilyTreeLayout } from '../src/utils/familyTreeLayout.js';
import { buildFamilyTreeLayoutV2 } from './test_prototype_layout.mjs';
import { getDemoFamilyData } from '../src/utils/demoData.js';

function checkOverlaps(nodes) {
  const overlaps = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      // Check vertical overlap (card height 220px)
      const yOverlap = (a.position.y < b.position.y + 220) && (b.position.y < a.position.y + 220);
      // Check horizontal overlap (card width 185px)
      const xOverlap = (a.position.x < b.position.x + 185) && (b.position.x < a.position.x + 185);

      if (yOverlap && xOverlap) {
        overlaps.push({
          nodeA: a.id + ' (' + a.data.person.first_name + ')',
          nodeB: b.id + ' (' + b.data.person.first_name + ')',
          posA: a.position,
          posB: b.position,
        });
      }
    }
  }
  return overlaps;
}

// SCENARIO 3: Demo Harrison Tree
const demoData = getDemoFamilyData('demo-family');
console.log('--- SCENARIO 3 (Demo Harrison Tree) ---');
const v1_3 = buildFamilyTreeLayout(demoData.people, demoData.relationships);
console.log('V1 Overlaps:', checkOverlaps(v1_3.nodes).length);
const v2_3 = buildFamilyTreeLayoutV2(demoData.people, demoData.relationships);
console.log('V2 Overlaps:', checkOverlaps(v2_3.nodes).length);
v2_3.nodes.forEach(n => console.log('  ', n.data.person.first_name, n.position));

// SCENARIO 4: 5 married siblings in Gen 1
const people4 = [
  { id: 'p1', first_name: 'P1', gender: 'Male' },
  { id: 'p2', first_name: 'P2', gender: 'Female' },
];
const rels4 = [
  { id: 'r_parents', person_1_id: 'p1', person_2_id: 'p2', relationship_type: 'spouse' },
];
for (let i = 1; i <= 5; i++) {
  people4.push({ id: `child${i}`, first_name: `Child${i}`, gender: i % 2 === 0 ? 'Female' : 'Male' });
  people4.push({ id: `spouse${i}`, first_name: `Spouse${i}`, gender: i % 2 === 0 ? 'Male' : 'Female' });
  rels4.push({ id: `rc1_${i}`, person_1_id: 'p1', person_2_id: `child${i}`, relationship_type: 'parent' });
  rels4.push({ id: `rc2_${i}`, person_1_id: 'p2', person_2_id: `child${i}`, relationship_type: 'parent' });
  rels4.push({ id: `rsp_${i}`, person_1_id: `child${i}`, person_2_id: `spouse${i}`, relationship_type: 'spouse' });
  // Each child has 2 kids
  for (let k = 1; k <= 2; k++) {
    const gcId = `gc_${i}_${k}`;
    people4.push({ id: gcId, first_name: `GC_${i}_${k}`, gender: 'Male' });
    rels4.push({ id: `rgc1_${i}_${k}`, person_1_id: `child${i}`, person_2_id: gcId, relationship_type: 'parent' });
    rels4.push({ id: `rgc2_${i}_${k}`, person_1_id: `spouse${i}`, person_2_id: gcId, relationship_type: 'parent' });
  }
}

console.log('\n--- SCENARIO 4 (5 Married Siblings with Children) ---');
const v1_4 = buildFamilyTreeLayout(people4, rels4);
console.log('V1 Overlaps:', checkOverlaps(v1_4.nodes).length);
const v2_4 = buildFamilyTreeLayoutV2(people4, rels4);
console.log('V2 Overlaps:', checkOverlaps(v2_4.nodes).length);
