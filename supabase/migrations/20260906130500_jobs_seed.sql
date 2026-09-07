-- Seed the job board with the listings the UI used to hard-code
-- (web/src/data/jobs.ts). Idempotent: re-running skips rows whose slug already
-- exists, so it is safe to keep in the migration history. Remove or replace
-- once employers are posting real jobs.

insert into public.jobs
  (slug, title, company_name, logo_bg, light_logo, location, job_type, category,
   salary_label, salary_type, featured, status, posted_at, expires_at)
values
  ('marketing-officer', 'Marketing Officer', 'Reddit', '#ff4500', false,
   'United Kingdom of Great Britain', 'Full Time', 'Digital Marketing',
   '$30K-$35K', 'Yearly', true, 'active', now(), now() + interval '30 days'),
  ('senior-ux-designer-dribbble', 'Senior UX Designer', 'Dribbble', '#ea4c89', false,
   'California', 'Full Time', 'Graphics & Design',
   '$50k-80k/month', 'Monthly', true, 'active', now(), now() + interval '30 days'),
  ('visual-designer', 'Visual Designer', 'Freepik', '#1e60c6', false,
   'China', 'Full Time', 'Graphics & Design',
   '$10K-$15K', 'Yearly', true, 'active', now(), now() + interval '30 days'),
  ('ui-ux-designer', 'UI/UX Designer', 'Figma', '#000000', false,
   'Canada', 'Full Time', 'Graphics & Design',
   '$50K-$70K', 'Yearly', true, 'active', now(), now() + interval '30 days'),
  ('junior-graphic-designer', 'Junior Graphic Designer', 'Dribbble', '#ea4c89', false,
   'United States', 'Temporary', 'Graphics & Design',
   '$35K-$40K', 'Yearly', false, 'active', now(), now() + interval '30 days'),
  ('senior-ux-designer-twitter', 'Senior UX Designer', 'Twitter', '#1da1f2', false,
   'Canada', 'Internship', 'Graphics & Design',
   '$50K-$60K', 'Yearly', false, 'active', now(), now() + interval '30 days'),
  ('product-designer', 'Product Designer', 'Microsoft', '#edeff5', true,
   'Australia', 'Full Time', 'Graphics & Design',
   '$40K-$50K', 'Yearly', false, 'active', now(), now() + interval '30 days'),
  ('technical-support-specialist', 'Techical Support Specialist', 'Upwork', '#6fda44', false,
   'France', 'Full Time', 'Code & Programing',
   '$35K-$40K', 'Yearly', false, 'active', now(), now() + interval '30 days'),
  ('networking-engineer', 'Networking Engineer', 'Slack', '#edeff5', true,
   'Germany', 'Remote', 'Code & Programing',
   '$50K-$90K', 'Yearly', false, 'active', now(), now() + interval '30 days'),
  ('front-end-developer', 'Front End Developer', 'Instagram', 'linear-gradient(135deg,#fa8f21,#d82d7e)', false,
   'Australia', 'Contract Base', 'Code & Programing',
   '$50K-$80K', 'Yearly', false, 'active', now(), now() + interval '30 days'),
  ('software-engineer', 'Software Engineer', 'Facebook', '#1877f2', false,
   'United Kingdom of Great Britain', 'Part Time', 'Code & Programing',
   '$15K-$20K', 'Yearly', false, 'active', now(), now() + interval '30 days'),
  ('interaction-designer', 'Interaction Designer', 'Youtube', '#ff0000', false,
   'Germany', 'Full Time', 'Graphics & Design',
   '$20K-$25K', 'Yearly', false, 'active', now(), now() + interval '30 days')
on conflict (slug) do nothing;
