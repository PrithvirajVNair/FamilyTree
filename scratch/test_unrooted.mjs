import { buildFamilyTreeView } from '../src/utils/familyTreeView.js';

const people = [
  { id: 'p-fp', first_name: 'FP', gender: 'Male', birth_date: '1950-01-01' },
  { id: 'p-pappu', first_name: 'pappu', gender: 'Female', birth_date: '1955-01-01' },
  { id: 'p-hmk', first_name: 'HMK', gender: 'Female', birth_date: '1980-01-01' },
  { id: 'p-pk', first_name: 'PK', gender: 'Male', birth_date: '1985-01-01' },
];

const relationships = [
  { id: 'r1', person_1_id: 'p-fp', person_2_id: 'p-pappu', relationship_type: 'spouse' },
  { id: 'r2', person_1_id: 'p-fp', person_2_id: 'p-hmk', relationship_type: 'parent' },
  { id: 'r3', person_1_id: 'p-pappu', person_2_id: 'p-hmk', relationship_type: 'parent' },
  { id: 'r4', person_1_id: 'p-fp', person_2_id: 'p-pk', relationship_type: 'parent' },
  { id: 'r5', person_1_id: 'p-pappu', person_2_id: 'p-pk', relationship_type: 'parent' },
];

console.log('--- TEST: Unrooted Default View (rootPersonId: null) ---');
const unrootedView = buildFamilyTreeView({
  rootPersonId: null,
  people,
  relationships,
});

console.log('rootPerson is null:', unrootedView.rootPerson === null);
console.log('visible people count:', unrootedView.people.length, 'expected:', people.length);
console.log('visible relationships count:', unrootedView.relationships.length, 'expected:', relationships.length);
console.log('isFiltered:', unrootedView.isFiltered, 'expected: false');
console.log('Any isRoot === true:', unrootedView.allRelativesWithKinship.some(r => r.isRoot));
console.log('Roles:');
unrootedView.allRelativesWithKinship.forEach(r => {
  console.log(`  ${r.person.first_name}: ${r.kinshipLabel} (isRoot: ${r.isRoot})`);
});

console.log('\n--- TEST: Focused View on PK (rootPersonId: p-pk) ---');
const pkView = buildFamilyTreeView({
  rootPersonId: 'p-pk',
  people,
  relationships,
});
console.log('rootPerson:', pkView.rootPerson?.first_name, 'expected: PK');
console.log('Roles relative to PK:');
pkView.allRelativesWithKinship.forEach(r => {
  console.log(`  ${r.person.first_name}: ${r.kinshipLabel} (isRoot: ${r.isRoot})`);
});
