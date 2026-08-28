export type EmployerJob = {
  title: string
  type: string
  remaining: string
  status: 'active' | 'expired'
  applications: number
  highlighted?: boolean
}

export const employerJobs: EmployerJob[] = [
  { title: 'UI/UX Designer', type: 'Full Time', remaining: '27 days remaing', status: 'active', applications: 798 },
  { title: 'Senior UX Designer', type: 'Internship', remaining: '8 days remaing', status: 'active', applications: 185 },
  { title: 'Techical Support Specialist', type: 'Part Time', remaining: '4 days remaing', status: 'active', applications: 556, highlighted: true },
  { title: 'Junior Graphic Designer', type: 'Full Time', remaining: '24 days remaing', status: 'active', applications: 583 },
  { title: 'Front End Developer', type: 'Full Time', remaining: 'Dec 7, 2019', status: 'expired', applications: 740 },
  { title: 'Interaction Designer', type: 'Contract Base', remaining: 'Feb 2, 2019', status: 'expired', applications: 426 },
  { title: 'Software Engineer', type: 'Temporary', remaining: '9 days remaing', status: 'active', applications: 922 },
  { title: 'Product Designer', type: 'Full Time', remaining: '7 days remaing', status: 'active', applications: 994 },
  { title: 'Project Manager', type: 'Full Time', remaining: 'Dec 4, 2019', status: 'expired', applications: 196 },
  { title: 'Marketing Manager', type: 'Full Time', remaining: '4 days remaing', status: 'active', applications: 492 },
]
