export type AppliedJob = {
  title: string
  type: string
  location: string
  salary: string
  date: string
  logoBg: string
  lightLogo?: boolean
  highlighted?: boolean
}

export type SavedJob = {
  title: string
  type: string
  location: string
  salary: string
  logoBg: string
  lightLogo?: boolean
  status: 'remaining' | 'expired'
  saved?: boolean
  highlighted?: boolean
}

export const appliedJobs: AppliedJob[] = [
  { title: 'Networking Engineer', type: 'Remote', location: 'Washington', salary: '$50k-80k/month', date: 'Feb 2, 2019 19:28', logoBg: '#6fda44' },
  { title: 'Product Designer', type: 'Full Time', location: 'Dhaka', salary: '$50k-80k/month', date: 'Dec 7, 2019 23:26', logoBg: '#ea4c89' },
  { title: 'Junior Graphic Designer', type: 'Temporary', location: 'Brazil', salary: '$50k-80k/month', date: 'Feb 2, 2019 19:28', logoBg: '#191f33' },
  { title: 'Visual Designer', type: 'Contract Base', location: 'Wisconsin', salary: '$50k-80k/month', date: 'Dec 7, 2019 23:26', logoBg: '#edeff5', lightLogo: true, highlighted: true },
  { title: 'Marketing Officer', type: 'Full Time', location: 'United States', salary: '$50k-80k/month', date: 'Dec 4, 2019 21:42', logoBg: '#1da1f2' },
  { title: 'UI/UX Designer', type: 'Full Time', location: 'North Dakota', salary: '$50k-80k/month', date: 'Dec 30, 2019 07:52', logoBg: '#1877f2' },
  { title: 'Software Engineer', type: 'Full Time', location: 'New York', salary: '$50k-80k/month', date: 'Dec 30, 2019 05:18', logoBg: '#edeff5', lightLogo: true },
  { title: 'Front End Developer', type: 'Full Time', location: 'Michigan', salary: '$50k-80k/month', date: 'Mar 20, 2019 23:14', logoBg: '#ff4500' },
]

export const favoriteJobs: SavedJob[] = [
  { title: 'Techical Support Specialist', type: 'Full Time', location: 'Idaho, USA', salary: '$15K-$20K', logoBg: '#edeff5', lightLogo: true, status: 'expired', saved: true },
  { title: 'UI/UX Designer', type: 'Full Time', location: 'Minnesota, USA', salary: '$10K-$15K', logoBg: '#ff0000', status: 'remaining', saved: true },
  { title: 'Senior UX Designer', type: 'Full Time', location: 'United Kingdom of Great Britain', salary: '$30K-$35K', logoBg: '#edeff5', lightLogo: true, status: 'remaining', saved: true, highlighted: true },
  { title: 'Junior Graphic Designer', type: 'Full Time', location: 'Mymensingh, Bangladesh', salary: '$40K-$50K', logoBg: '#1877f2', status: 'remaining', saved: true },
  { title: 'Techical Support Specialist', type: 'Full Time', location: 'Idaho, USA', salary: '$15K-$20K', logoBg: '#edeff5', lightLogo: true, status: 'expired', saved: true },
  { title: 'Product Designer', type: 'Full Time', location: 'Sivas, Turkey', salary: '$50K-$70K', logoBg: '#1da1f2', status: 'remaining', saved: true },
  { title: 'Project Manager', type: 'Full Time', location: 'Ohio, USA', salary: '$50K-$80K', logoBg: '#eb5252', status: 'remaining', saved: true },
  { title: 'Marketing Manager', type: 'Temporary', location: 'Konya, Turkey', salary: '$20K-$25K', logoBg: '#edeff5', lightLogo: true, status: 'remaining', saved: true },
  { title: 'Visual Designer', type: 'Part Time', location: 'Washington, USA', salary: '$10K-$15K', logoBg: '#191f33', status: 'remaining', saved: true },
  { title: 'Interaction Designer', type: 'Remote', location: 'Penn, USA', salary: '$35K-$40K', logoBg: '#000000', status: 'remaining', saved: true },
]

export const alertJobs: SavedJob[] = [
  { title: 'Techical Support Specialist', type: 'Full Time', location: 'Idaho, USA', salary: '$15K-$20K', logoBg: '#edeff5', lightLogo: true, status: 'remaining' },
  { title: 'UI/UX Designer', type: 'Full Time', location: 'Minnesota, USA', salary: '$10K-$15K', logoBg: '#ff0000', status: 'remaining' },
  { title: 'Front End Developer', type: 'Internship', location: 'Mymensingh, Bangladesh', salary: '$10K-$15K', logoBg: '#ff4500', status: 'remaining', saved: true },
  { title: 'Marketing Officer', type: 'Full Time', location: 'Montana, USA', salary: '$50K-$60K', logoBg: '#1877f2', status: 'remaining' },
  { title: 'Networking Engineer', type: 'Full Time', location: 'Michigan, USA', salary: '$5K-$10K', logoBg: 'linear-gradient(135deg,#fa8f21,#d82d7e)', status: 'remaining', saved: true },
  { title: 'Senior UX Designer', type: 'Full Time', location: 'United Kingdom of Great Britain', salary: '$30K-$35K', logoBg: '#edeff5', lightLogo: true, status: 'remaining', highlighted: true },
  { title: 'Junior Graphic Designer', type: 'Full Time', location: 'Mymensingh, Bangladesh', salary: '$40K-$50K', logoBg: '#1877f2', status: 'remaining' },
  { title: 'Product Designer', type: 'Full Time', location: 'Sivas, Turkey', salary: '$50K-$70K', logoBg: '#1da1f2', status: 'remaining' },
  { title: 'Project Manager', type: 'Full Time', location: 'Ohio, USA', salary: '$50K-$80K', logoBg: '#eb5252', status: 'remaining' },
]
