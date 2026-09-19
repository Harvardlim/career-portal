-- partly.asia taxonomy: the 10 main categories and their sub-categories.
--
-- The spec's sub-category tables list only 8 groups, but the site design calls
-- for a 10-tile grid that also includes "Training & Corporate Learning" and
-- "Design & Creative". Rather than duplicate rows across tiles, the four
-- training sub-categories are moved out of HR and the three design ones out of
-- Marketing into those two categories.
--
-- Seeding is idempotent on slug, so re-running never duplicates and never
-- clobbers names a staff member edited in the backoffice.

alter table public.categories
  add column if not exists description text,
  add column if not exists icon text,
  add column if not exists sort_order integer not null default 0;

alter table public.subcategories
  add column if not exists notes text,
  add column if not exists sort_order integer not null default 0;

-- subcategories.slug had no uniqueness guard; scope it per category so the
-- seed below can upsert.
create unique index if not exists subcategories_category_slug_key
  on public.subcategories (category_id, slug);

insert into public.categories (name, slug, icon, sort_order) values
  ('Human Resources',                  'human-resources',      'users',      1),
  ('Information Technology',           'information-technology','monitor',   2),
  ('Finance',                          'finance',              'coins',      3),
  ('Marketing',                        'marketing',            'megaphone',  4),
  ('Legal',                            'legal',                'scale',      5),
  ('Sales & Business Development',     'sales-business-development','trending-up', 6),
  ('Strategy & Management Consulting', 'strategy-consulting',  'compass',    7),
  ('Operations',                       'operations',           'settings',   8),
  ('Training & Corporate Learning',    'training-corporate-learning','graduation-cap', 9),
  ('Design & Creative',                'design-creative',      'palette',   10)
on conflict (slug) do update set
  icon = excluded.icon,
  sort_order = excluded.sort_order;

-- (category slug, sub-category name, sub-category slug, notes / examples)
with seed(category_slug, name, slug, notes, sort_order) as (
  values
    -- 1. Human Resources
    ('human-resources','Recruitment & Talent Acquisition','recruitment-talent-acquisition','Sourcing, screening, interview support',1),
    ('human-resources','HR Policy & Employee Handbook','hr-policy-employee-handbook','Drafting, review, compliance updates',2),
    ('human-resources','Compensation & Benefits','compensation-benefits','Salary benchmarking, benefits design',3),
    ('human-resources','Employee Relations & Investigations','employee-relations-investigations','Grievance handling, workplace investigations',4),
    ('human-resources','Terminations & Retrenchment Advisory','terminations-retrenchment-advisory','Process design, documentation, compliance',5),
    ('human-resources','HRIS Implementation','hris-implementation','Payroll/HR system setup and migration',6),
    ('human-resources','Learning & Development / Training','learning-development-training','Onboarding programs, skills training design',7),
    ('human-resources','Data & Analytics (HR)','data-analytics-hr','People analytics, headcount/attrition reporting',8),

    -- 2. Information Technology
    ('information-technology','Software Development','software-development','Web, mobile, backend/API development',1),
    ('information-technology','IT Infrastructure & Systems Admin','it-infrastructure-systems-admin','Network setup, server management, cloud migration',2),
    ('information-technology','Cybersecurity','cybersecurity','Audits, penetration testing, compliance (PDPA/GDPR)',3),
    ('information-technology','IT Support & Helpdesk','it-support-helpdesk','Fractional/part-time technical support',4),
    ('information-technology','Data & Analytics (IT)','data-analytics-it','Data engineering, dashboards, BI tools',5),
    ('information-technology','Cloud & DevOps','cloud-devops','AWS/Azure/GCP setup, CI/CD pipelines',6),
    ('information-technology','QA & Testing','qa-testing','Manual/automated software testing',7),

    -- 3. Finance
    ('finance','Fractional CFO / Finance Director','fractional-cfo','Strategic financial leadership, board reporting',1),
    ('finance','Bookkeeping & Accounting','bookkeeping-accounting','Day-to-day accounts, reconciliation',2),
    ('finance','Tax Advisory & Compliance','tax-advisory-compliance','Corporate tax filing, GST/VAT compliance',3),
    ('finance','Financial Planning & Analysis (FP&A)','financial-planning-analysis','Budgeting, forecasting, cash flow modelling',4),
    ('finance','Audit & Assurance Support','audit-assurance-support','Internal audit prep, external audit liaison',5),
    ('finance','Fundraising & Investor Relations','fundraising-investor-relations','Pitch decks, cap table, due diligence support',6),
    ('finance','Data & Analytics (Finance)','data-analytics-finance','Financial modelling, KPI dashboards',7),

    -- 4. Marketing
    ('marketing','Digital Marketing & Performance Ads','digital-marketing-performance-ads','Paid social, Google Ads, SEO',1),
    ('marketing','Content Marketing & Copywriting','content-marketing-copywriting','Blogs, website copy, email campaigns',2),
    ('marketing','Brand Strategy & Positioning','brand-strategy-positioning','Brand identity, messaging frameworks',3),
    ('marketing','Social Media Management','social-media-management','Content calendars, community management',4),
    ('marketing','Marketing Automation & CRM','marketing-automation-crm','HubSpot/Mailchimp setup, lead-nurture flows',5),
    ('marketing','Public Relations & Communications','public-relations-communications','Press outreach, crisis communications',6),
    ('marketing','Data & Analytics (Marketing)','data-analytics-marketing','Campaign analytics, attribution modelling',7),

    -- 5. Legal
    ('legal','Contract Drafting & Review','contract-drafting-review','Commercial contracts, vendor agreements',1),
    ('legal','Corporate & Compliance Advisory','corporate-compliance-advisory','Company secretarial, regulatory compliance',2),
    ('legal','Employment Law Advisory','employment-law-advisory','Policy review, dispute risk assessment',3),
    ('legal','Intellectual Property','intellectual-property','Trademark/patent filing support, IP strategy',4),
    ('legal','Data Protection & Privacy (PDPA/GDPR)','data-protection-privacy','Privacy policy drafting, compliance audits',5),
    ('legal','Dispute Resolution Support','dispute-resolution-support','Mediation prep, documentation support',6),
    ('legal','Common Reporting Standards','common-reporting-standards','CRS advisory, documentation preparation',7),

    -- 6. Sales & Business Development
    ('sales-business-development','Fractional Sales Director / Head of Sales','fractional-sales-director','Sales strategy, pipeline leadership',1),
    ('sales-business-development','Lead Generation & Prospecting','lead-generation-prospecting','Outbound campaigns, list building',2),
    ('sales-business-development','Business Development / Partnerships','business-development-partnerships','Channel partnerships, deal structuring',3),
    ('sales-business-development','Sales Enablement & Training','sales-enablement-training','Playbooks, sales coaching, CRM adoption',4),
    ('sales-business-development','Account Management','account-management','Client retention, upsell strategy',5),
    ('sales-business-development','Data & Analytics (Sales)','data-analytics-sales','Pipeline reporting, conversion analysis',6),

    -- 7. Strategy & Management Consulting
    ('strategy-consulting','Business Strategy & Growth Planning','business-strategy-growth-planning','Market entry, growth roadmaps',1),
    ('strategy-consulting','Project Management Office (PMO)','project-management-office','Project governance, delivery oversight',2),
    ('strategy-consulting','Process Improvement / Operations Consulting','process-improvement-consulting','Workflow redesign, efficiency audits',3),
    ('strategy-consulting','Change Management','change-management','Org restructuring, transformation programs',4),
    ('strategy-consulting','Mergers & Acquisitions Advisory','mergers-acquisitions-advisory','Due diligence, integration planning',5),
    ('strategy-consulting','Sustainability & ESG Consulting','sustainability-esg-consulting','ESG reporting, sustainability strategy',6),
    ('strategy-consulting','Data & Analytics (Strategy)','data-analytics-strategy','Market research, competitive analysis',7),

    -- 8. Operations
    ('operations','Supply Chain & Logistics','supply-chain-logistics','Inventory management, vendor sourcing',1),
    ('operations','Operations Management','operations-management','SOP design, process documentation',2),
    ('operations','Procurement','procurement','Vendor negotiation, purchasing strategy',3),
    ('operations','Quality Assurance / Compliance Ops','quality-assurance-compliance-ops','ISO compliance, quality audits',4),
    ('operations','Facilities & Admin Operations','facilities-admin-operations','Office/workspace management support',5),
    ('operations','Data & Analytics (Operations)','data-analytics-operations','Operational KPIs, efficiency dashboards',6),

    -- 9. Training & Corporate Learning (moved out of the spec's HR table)
    ('training-corporate-learning','Corporate Workshop Facilitation','corporate-workshop-facilitation','In-person/virtual workshop delivery',1),
    ('training-corporate-learning','Curriculum & Course Design','curriculum-course-design','L&D program design, e-learning content',2),
    ('training-corporate-learning','Executive Coaching','executive-coaching','1:1 leadership coaching',3),
    ('training-corporate-learning','Compliance Training','compliance-training','Workplace safety, anti-harassment, PDPA training',4),

    -- 10. Design & Creative (moved out of the spec's Marketing table)
    ('design-creative','Brand & Visual Identity','brand-visual-identity','Logo, brand guidelines (strategic, not gig-level)',1),
    ('design-creative','UX/UI Design','ux-ui-design','Product and web design',2),
    ('design-creative','Presentation & Pitch Deck Design','presentation-pitch-deck-design','Investor decks, sales presentations',3)
)
insert into public.subcategories (category_id, name, slug, notes, sort_order)
select c.id, s.name, s.slug, s.notes, s.sort_order
from seed s
join public.categories c on c.slug = s.category_slug
on conflict (category_id, slug) do update set
  notes = excluded.notes,
  sort_order = excluded.sort_order;
