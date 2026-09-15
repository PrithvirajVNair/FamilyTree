import { buildFamilyTreeLayoutV3, calculateGenerations } from './test_prototype_v3.mjs';
import { getDemoFamilyData } from '../src/utils/demoData.js';

function checkOverlaps(nodes) {
  const overlaps = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const yOverlap = (a.position.y < b.position.y + 220) && (b.position.y < a.position.y + 220);
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

console.log('=== TEST 1: Sibling Partner Divergence ===');
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

const layout1 = buildFamilyTreeLayoutV3(people1, rels1);
const rPos = layout1.nodes.find(n => n.id === 'robert')?.position;
const aPos = layout1.nodes.find(n => n.id === 'anna')?.position;
const mPos = layout1.nodes.find(n => n.id === 'michael')?.position;
console.log('Robert Y:', rPos?.y, 'Anna Y:', aPos?.y, 'Michael Y:', mPos?.y);
console.log('Same Y for siblings and partner?', rPos?.y === mPos?.y && rPos?.y === aPos?.y);
console.log('Overlaps in Test 1:', checkOverlaps(layout1.nodes).length);
layout1.nodes.forEach(n => console.log('  ', n.data.person.first_name, n.position));

console.log('\n=== TEST 2: Demo Harrison Tree ===');
const demoData = getDemoFamilyData('demo-family');
const layoutDemo = buildFamilyTreeLayoutV3(demoData.people, demoData.relationships);
console.log('Overlaps in Demo Tree:', checkOverlaps(layoutDemo.nodes).length);
layoutDemo.nodes.forEach(n => console.log('  ', n.data.person.first_name, n.position));

console.log('\n=== TEST 3: 5 Married Siblings with Children ===');
const people4 = [
  { id: 'p1', first_name: 'P1', gender: 'Male', birth_date: '1920-01-01' },
  { id: 'p2', first_name: 'P2', gender: 'Female', birth_date: '1922-01-01' },
];
const rels4 = [
  { id: 'r_parents', person_1_id: 'p1', person_2_id: 'p2', relationship_type: 'spouse' },
];
for (let i = 1; i <= 5; i++) {
  people4.push({ id: `child${i}`, first_name: `Child${i}`, gender: i % 2 === 0 ? 'Female' : 'Male', birth_date: `${1950 + i * 2}-01-01` });
  people4.push({ id: `spouse${i}`, first_name: `Spouse${i}`, gender: i % 2 === 0 ? 'Male' : 'Female', birth_date: `${1951 + i * 2}-01-01` });
  rels4.push({ id: `rc1_${i}`, person_1_id: 'p1', person_2_id: `child${i}`, relationship_type: 'parent' });
  rels4.push({ id: `rc2_${i}`, person_1_id: 'p2', person_2_id: `child${i}`, relationship_type: 'parent' });
  rels4.push({ id: `rsp_${i}`, person_1_id: `child${i}`, person_2_id: `spouse${i}`, relationship_type: 'spouse' });
  for (let k = 1; k <= 2; k++) {
    const gcId = `gc_${i}_${k}`;
    people4.push({ id: gcId, first_name: `GC_${i}_${k}`, gender: 'Male', birth_date: `${1980 + i + k}-01-01` });
    rels4.push({ id: `rgc1_${i}_${k}`, person_1_id: `child${i}`, person_2_id: gcId, relationship_type: 'parent' });
    rels4.push({ id: `rgc2_${i}_${k}`, person_1_id: `spouse${i}`, person_2_id: gcId, relationship_type: 'parent' });
  }
}

const layout4 = buildFamilyTreeLayoutV3(people4, rels4);
console.log('Overlaps in 5 Married Siblings:', checkOverlaps(layout4.nodes).length);
// Check Y values of all 5 children and their 5 spouses
const gen1Y = layout4.nodes.filter(n => n.id.startsWith('child') || n.id.startsWith('spouse')).map(n => n.position.y);
console.log('All 5 siblings + 5 spouses on identical Y?', gen1Y.every(y => y === gen1Y[0]), 'Y =', gen1Y[0]);

// Check X ordering of Child1, Child2, Child3, Child4, Child5
const childXs = [1, 2, 3, 4, 5].map(i => layout4.nodes.find(n => n.id === `child${i}`).position.x);
console.log('Child X positions:', childXs);
console.log('Are siblings in chronological left-to-right order?', childXs.every((x, i) => i === 0 || x > childXs[i - 1]));
