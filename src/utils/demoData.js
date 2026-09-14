/**
 * Sample 3-generation demo family tree for testing and development.
 * Used when a user creates an empty tree and clicks "Load Demo Tree".
 */

export function getDemoFamilyData(familyId) {
  const people = [
    // Generation 0: Grandparents
    {
      id: 'demo-p-george',
      family_id: familyId,
      first_name: 'George',
      middle_name: 'Arthur',
      last_name: 'Harrison',
      gender: 'Male',
      birth_date: '1920-04-12',
      death_date: '1998-11-03',
      birth_place: 'Edinburgh, Scotland',
      notes: 'Naval engineer and avid clockmaker. Served in the Atlantic during WWII.',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-p-mary',
      family_id: familyId,
      first_name: 'Mary',
      middle_name: 'Elizabeth',
      last_name: 'Harrison',
      gender: 'Female',
      birth_date: '1924-08-22',
      death_date: '2005-02-14',
      birth_place: 'York, England',
      notes: 'Teacher and botanical watercolorist. Maintained the family rose garden for 50 years.',
      photo_url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=240&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    },

    // Generation 1: Children of George & Mary
    {
      id: 'demo-p-robert',
      family_id: familyId,
      first_name: 'Robert',
      middle_name: 'James',
      last_name: 'Harrison',
      gender: 'Male',
      birth_date: '1952-06-15',
      death_date: null,
      birth_place: 'London, England',
      notes: 'Professor of architectural history and classical pianist.',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-p-anna',
      family_id: familyId,
      first_name: 'Anna',
      middle_name: 'Claire',
      last_name: 'Harrison',
      gender: 'Female',
      birth_date: '1955-03-09',
      death_date: null,
      birth_place: 'Bordeaux, France',
      notes: 'Landscape architect and conservation advocate.',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-p-michael',
      family_id: familyId,
      first_name: 'Michael',
      middle_name: 'Edward',
      last_name: 'Harrison',
      gender: 'Male',
      birth_date: '1958-11-20',
      death_date: null,
      birth_place: 'London, England',
      notes: 'Documentary filmmaker and world traveler.',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    },

    // Generation 2: Grandchildren (Children of Robert & Anna)
    {
      id: 'demo-p-john',
      family_id: familyId,
      first_name: 'John',
      middle_name: 'Mathew',
      last_name: 'Harrison',
      gender: 'Male',
      birth_date: '1982-01-18',
      death_date: null,
      birth_place: 'Oxford, England',
      notes: 'Software engineer and mountain hiker.',
      photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-p-sarah',
      family_id: familyId,
      first_name: 'Sarah',
      middle_name: 'Grace',
      last_name: 'Harrison',
      gender: 'Female',
      birth_date: '1986-09-04',
      death_date: null,
      birth_place: 'Oxford, England',
      notes: 'Pediatrician and avid marathon runner.',
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    },
  ];

  const relationships = [
    // George and Mary are spouses
    {
      id: 'demo-rel-1',
      family_id: familyId,
      person_1_id: 'demo-p-george',
      person_2_id: 'demo-p-mary',
      relationship_type: 'spouse',
      created_at: new Date().toISOString(),
    },
    // George and Mary are parents of Robert
    {
      id: 'demo-rel-2',
      family_id: familyId,
      person_1_id: 'demo-p-george',
      person_2_id: 'demo-p-robert',
      relationship_type: 'parent',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rel-3',
      family_id: familyId,
      person_1_id: 'demo-p-mary',
      person_2_id: 'demo-p-robert',
      relationship_type: 'parent',
      created_at: new Date().toISOString(),
    },
    // George and Mary are parents of Michael
    {
      id: 'demo-rel-4',
      family_id: familyId,
      person_1_id: 'demo-p-george',
      person_2_id: 'demo-p-michael',
      relationship_type: 'parent',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rel-5',
      family_id: familyId,
      person_1_id: 'demo-p-mary',
      person_2_id: 'demo-p-michael',
      relationship_type: 'parent',
      created_at: new Date().toISOString(),
    },
    // Robert and Anna are spouses
    {
      id: 'demo-rel-6',
      family_id: familyId,
      person_1_id: 'demo-p-robert',
      person_2_id: 'demo-p-anna',
      relationship_type: 'spouse',
      created_at: new Date().toISOString(),
    },
    // Robert and Anna are parents of John
    {
      id: 'demo-rel-7',
      family_id: familyId,
      person_1_id: 'demo-p-robert',
      person_2_id: 'demo-p-john',
      relationship_type: 'parent',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rel-8',
      family_id: familyId,
      person_1_id: 'demo-p-anna',
      person_2_id: 'demo-p-john',
      relationship_type: 'parent',
      created_at: new Date().toISOString(),
    },
    // Robert and Anna are parents of Sarah
    {
      id: 'demo-rel-9',
      family_id: familyId,
      person_1_id: 'demo-p-robert',
      person_2_id: 'demo-p-sarah',
      relationship_type: 'parent',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-rel-10',
      family_id: familyId,
      person_1_id: 'demo-p-anna',
      person_2_id: 'demo-p-sarah',
      relationship_type: 'parent',
      created_at: new Date().toISOString(),
    },
  ];

  return { people, relationships };
}
