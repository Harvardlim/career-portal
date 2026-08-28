export type Job = {
  id: string
  title: string
  company: string
  logoBg: string
  lightLogo?: boolean
  location: string
  type: string
  salary: string
  remaining?: string
  featured?: boolean
  highlighted?: boolean
}

/** Sample job listings used by the Find Job grid / list views. */
export const jobs: Job[] = [
  {
    id: 'marketing-officer',
    title: 'Marketing Officer',
    company: 'Reddit',
    logoBg: '#ff4500',
    location: 'United Kingdom of Great Britain',
    type: 'Full Time',
    salary: '$30K-$35K',
    remaining: '4 Days Remaining',
    featured: true,
  },
  {
    id: 'sunior-ux-designer',
    title: 'Sunior UX Designer.',
    company: 'Dribbble',
    logoBg: '#ea4c89',
    location: 'California',
    type: 'Full-Time',
    salary: '$50k-80k/month',
    remaining: '4 Days Remaining',
    featured: true,
    highlighted: true,
  },
  {
    id: 'visual-designer',
    title: 'Visual Designer',
    company: 'Freepik',
    logoBg: '#1e60c6',
    location: 'China',
    type: 'Full Time',
    salary: '$10K-$15K',
    remaining: '4 Days Remaining',
    featured: true,
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    company: 'Figma',
    logoBg: '#000000',
    location: 'Canada',
    type: 'Full Time',
    salary: '$50K-$70K',
    remaining: '4 Days Remaining',
    featured: true,
  },
  {
    id: 'junior-graphic-designer',
    title: 'Junior Graphic Designer',
    company: 'Dribbble',
    logoBg: '#ea4c89',
    location: 'United States',
    type: 'Temporary',
    salary: '$35K-$40K',
    remaining: '4 Days Remaining',
  },
  {
    id: 'senior-ux-designer',
    title: 'Senior UX Designer',
    company: 'Twitter',
    logoBg: '#1da1f2',
    location: 'Canada',
    type: 'Internship',
    salary: '$50K-$60K',
    remaining: '4 Days Remaining',
  },
  {
    id: 'product-designer',
    title: 'Product Designer',
    company: 'Microsoft',
    logoBg: '#edeff5',
    lightLogo: true,
    location: 'Australia',
    type: 'Full Time',
    salary: '$40K-$50K',
    remaining: '4 Days Remaining',
  },
  {
    id: 'technical-support-specialist',
    title: 'Techical Support Specialist',
    company: 'Upwork',
    logoBg: '#6fda44',
    location: 'France',
    type: 'Full Time',
    salary: '$35K-$40K',
    remaining: '4 Days Remaining',
  },
  {
    id: 'networking-engineer',
    title: 'Networking Engineer',
    company: 'Slack',
    logoBg: '#edeff5',
    lightLogo: true,
    location: 'Germany',
    type: 'Remote',
    salary: '$50K-$90K',
    remaining: '4 Days Remaining',
  },
  {
    id: 'front-end-developer',
    title: 'Front End Developer',
    company: 'Instagram',
    logoBg: 'linear-gradient(135deg,#fa8f21,#d82d7e)',
    location: 'Australia',
    type: 'Contract Base',
    salary: '$50K-$80K',
    remaining: '4 Days Remaining',
  },
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    company: 'Facebook',
    logoBg: '#1877f2',
    location: 'United Kingdom of Great Britain',
    type: 'Part Time',
    salary: '$15K-$20K',
    remaining: '4 Days Remaining',
  },
  {
    id: 'interaction-designer',
    title: 'Interaction Designer',
    company: 'Youtube',
    logoBg: '#ff0000',
    location: 'Germany',
    type: 'Full Time',
    salary: '$20K-$25K',
    remaining: '4 Days Remaining',
  },
]
