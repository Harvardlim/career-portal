export type Candidate = {
  id: string
  name: string
  role: string
  location: string
  experience: string
  highlighted?: boolean
}

export const candidates: Candidate[] = [
  { id: 'cody-fisher', name: 'Cody Fisher', role: 'Marketing Officer', location: 'New York', experience: '3 Years experience' },
  { id: 'darrell-steward', name: 'Darrell Steward', role: 'Interaction Designer', location: 'New York', experience: '3 Years experience' },
  { id: 'guy-hawkins', name: 'Guy Hawkins', role: 'Junior Graphic Designer', location: 'New York', experience: '3 Years experience' },
  { id: 'jane-cooper', name: 'Jane Cooper', role: 'Senior UX Designer', location: 'New York', experience: '3 Years experience', highlighted: true },
  { id: 'theresa-webb', name: 'Theresa Webb', role: 'Front End Developer', location: 'New York', experience: '3 Years experience' },
  { id: 'kathryn-murphy', name: 'Kathryn Murphy', role: 'Techical Support Specialist', location: 'New York', experience: '3 Years experience' },
  { id: 'marvin-mckinney', name: 'Marvin McKinney', role: 'UI/UX Designer', location: 'New York', experience: '3 Years experience' },
  { id: 'jenny-wilson', name: 'Jenny Wilson', role: 'Marketing Manager', location: 'New York', experience: '3 Years experience' },
  { id: 'leslie-alexander', name: 'Leslie Alexander', role: 'Project Manager', location: 'New York', experience: '3 Years experience' },
  { id: 'wade-warren', name: 'Wade Warren', role: 'Software Engineer', location: 'New York', experience: '3 Years experience' },
  { id: 'courtney-henry', name: 'Courtney Henry', role: 'Visual Designer', location: 'New York', experience: '3 Years experience' },
]
