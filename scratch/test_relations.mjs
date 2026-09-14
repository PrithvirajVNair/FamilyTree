import { calculateGenerations, buildFamilyTreeLayout } from '../src/utils/familyTreeLayout.js';
import { createFamilyGraph } from '../src/utils/familyGraph.js';
import { buildFamilyTreeView } from '../src/utils/familyTreeView.js';

// People: FP, pappu, HMK, PK
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

console.log('--- TEST 1: calculateGenerations ---');
const gens = calculateGenerations(people, relationships);
for (const [id, g] of gens.entries()) {
  console.log(`Person ${id} -> Gen ${g}`);
}

console.log('\n--- TEST 2: buildFamilyTreeLayout ---');
const layout = buildFamilyTreeLayout(people, relationships);
layout.nodes.forEach((n) => {
  console.log(`Node ${n.id} (${n.data.person.first_name}) -> X: ${n.position.x}, Y: ${n.position.y}, Gen: ${n.data.generation}`);
});

console.log('\n--- TEST 3: Edge Routes ---');
layout.edges.forEach((e) => {
  console.log(`Edge ${e.id} -> Type: ${e.type}, Source: ${e.source}, Target: ${e.target}`);
});

console.log('\n--- TEST 4: View centered on PK ---');
const viewPK = buildFamilyTreeView({
  rootPersonId: 'p-pk',
  people,
  relationships,
  options: { ancestors: 2, descendants: 2, includeSpouses: true, includeSiblings: true },
});
console.log('Visible people in PK view:', viewPK.people.map((p) => p.first_name));
console.log('All relatives with kinship in PK view:');
viewPK.allRelativesWithKinship.forEach((r) => {
  console.log(`- ${r.person.first_name}: ${r.kinshipLabel} (isVisible: ${r.isVisible})`);
});
