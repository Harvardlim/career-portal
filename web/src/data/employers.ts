export type Employer = {
  id: string
  name: string
  logoBg: string
  lightLogo?: boolean
  location: string
  openJobs: number
}

export const employers: Employer[] = [
  { id: 'dribbble', name: 'Dribbble', logoBg: '#ea4c89', location: 'United States', openJobs: 3 },
  { id: 'udemy', name: 'Udemy', logoBg: '#eb5252', location: 'China', openJobs: 3 },
  { id: 'figma', name: 'Figma', logoBg: '#000000', location: 'United States', openJobs: 3 },
  { id: 'google', name: 'Google', logoBg: '#edeff5', lightLogo: true, location: 'Australia', openJobs: 3 },
  { id: 'microsoft', name: 'Microsoft', logoBg: '#edeff5', lightLogo: true, location: 'Australia', openJobs: 3 },
  { id: 'twitter', name: 'Twitter', logoBg: '#1da1f2', location: 'Australia', openJobs: 3 },
  { id: 'instagram', name: 'Instagram', logoBg: 'linear-gradient(135deg,#fa8f21,#d82d7e)', location: 'Australia', openJobs: 3 },
  { id: 'youtube', name: 'Youtube', logoBg: '#ff0000', location: 'Canada', openJobs: 3 },
  { id: 'apple', name: 'Apple', logoBg: '#191f33', location: 'United States', openJobs: 3 },
  { id: 'slack', name: 'Slack', logoBg: '#edeff5', lightLogo: true, location: 'Germany', openJobs: 3 },
  { id: 'reddit', name: 'Reddit', logoBg: '#ff4500', location: 'France', openJobs: 3 },
  { id: 'upwork', name: 'Upwork', logoBg: '#6fda44', location: 'China', openJobs: 3 },
]
