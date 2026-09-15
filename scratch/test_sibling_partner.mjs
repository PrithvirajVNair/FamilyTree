import { calculateGenerations, buildFamilyTreeLayout } from '../src/utils/familyTreeLayout.js';

// TEST 1: Generation level divergence between siblings and partners
// George & Mary have 3 children: Robert, Anna, Michael
// Anna has in-law ancestors (Dad, Grandpa)
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

console.log('--- TEST 1: Generation divergence ---');
const gens1 = calculateGenerations(people1, rels1);
console.log('Robert gen:', gens1.get('robert'));
console.log('Anna gen (Robert spouse):', gens1.get('anna'));
console.log('Michael gen (Robert brother):', gens1.get('michael'));

const layout1 = buildFamilyTreeLayout(people1, rels1);
const rPos = layout1.nodes.find(n => n.id === 'robert')?.position;
const aPos = layout1.nodes.find(n => n.id === 'anna')?.position;
const mPos = layout1.nodes.find(n => n.id === 'michael')?.position;

console.log('Robert Y:', rPos?.y);
console.log('Anna Y:', aPos?.y);
console.log('Michael Y:', mPos?.y);
console.log('Are Robert and Michael on same Y level?', rPos?.y === mPos?.y);
console.log('Are Robert and Anna on same Y level?', rPos?.y === aPos?.y);
