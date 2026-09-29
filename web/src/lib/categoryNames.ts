import { currentLocale } from './i18n'

// Category / sub-category names live in the database in English (they are also the
// stored values), so the translation is applied only when a name is displayed.
// Anything not listed here (for example a name a staff member added later) shows as-is.
type Names = { zh: string; ms: string }

const NAMES: Record<string, Names> = {
  'Human Resources': { zh: '人力资源', ms: 'Sumber Manusia' },
  'Information Technology': { zh: '信息技术', ms: 'Teknologi Maklumat' },
  Finance: { zh: '财务', ms: 'Kewangan' },
  Marketing: { zh: '市场营销', ms: 'Pemasaran' },
  Legal: { zh: '法律', ms: 'Undang-undang' },
  'Sales & Business Development': { zh: '销售与业务拓展', ms: 'Jualan & Pembangunan Perniagaan' },
  'Strategy & Management Consulting': { zh: '战略与管理咨询', ms: 'Strategi & Perundingan Pengurusan' },
  Operations: { zh: '运营', ms: 'Operasi' },
  'Training & Corporate Learning': { zh: '培训与企业学习', ms: 'Latihan & Pembelajaran Korporat' },
  'Design & Creative': { zh: '设计与创意', ms: 'Reka Bentuk & Kreatif' },

  'Recruitment & Talent Acquisition': { zh: '招聘与人才获取', ms: 'Pengambilan & Pemerolehan Bakat' },
  'HR Policy & Employee Handbook': { zh: '人力资源政策与员工手册', ms: 'Dasar HR & Buku Panduan Pekerja' },
  'Compensation & Benefits': { zh: '薪酬与福利', ms: 'Pampasan & Faedah' },
  'Employee Relations & Investigations': { zh: '员工关系与调查', ms: 'Hubungan Pekerja & Siasatan' },
  'Terminations & Retrenchment Advisory': { zh: '解雇与裁员咨询', ms: 'Nasihat Penamatan & Pemberhentian' },
  'HRIS Implementation': { zh: 'HRIS 系统实施', ms: 'Pelaksanaan HRIS' },
  'Learning & Development / Training': { zh: '学习与发展 / 培训', ms: 'Pembelajaran & Pembangunan / Latihan' },
  'Data & Analytics (HR)': { zh: '数据与分析（人力资源）', ms: 'Data & Analitik (HR)' },

  'Software Development': { zh: '软件开发', ms: 'Pembangunan Perisian' },
  'IT Infrastructure & Systems Admin': { zh: 'IT 基础设施与系统管理', ms: 'Infrastruktur IT & Pentadbiran Sistem' },
  Cybersecurity: { zh: '网络安全', ms: 'Keselamatan Siber' },
  'IT Support & Helpdesk': { zh: 'IT 支持与服务台', ms: 'Sokongan IT & Meja Bantuan' },
  'Data & Analytics (IT)': { zh: '数据与分析（IT）', ms: 'Data & Analitik (IT)' },
  'Cloud & DevOps': { zh: '云与 DevOps', ms: 'Awan & DevOps' },
  'QA & Testing': { zh: '质量保证与测试', ms: 'QA & Pengujian' },

  'Fractional CFO / Finance Director': { zh: '兼职首席财务官 / 财务总监', ms: 'CFO Sambilan / Pengarah Kewangan' },
  'Bookkeeping & Accounting': { zh: '记账与会计', ms: 'Simpan Kira & Perakaunan' },
  'Tax Advisory & Compliance': { zh: '税务咨询与合规', ms: 'Nasihat Cukai & Pematuhan' },
  'Financial Planning & Analysis (FP&A)': { zh: '财务规划与分析 (FP&A)', ms: 'Perancangan & Analisis Kewangan (FP&A)' },
  'Audit & Assurance Support': { zh: '审计与鉴证支持', ms: 'Sokongan Audit & Jaminan' },
  'Fundraising & Investor Relations': { zh: '融资与投资者关系', ms: 'Pengumpulan Dana & Hubungan Pelabur' },
  'Data & Analytics (Finance)': { zh: '数据与分析（财务）', ms: 'Data & Analitik (Kewangan)' },

  'Digital Marketing & Performance Ads': { zh: '数字营销与效果广告', ms: 'Pemasaran Digital & Iklan Prestasi' },
  'Content Marketing & Copywriting': { zh: '内容营销与文案撰写', ms: 'Pemasaran Kandungan & Penulisan Iklan' },
  'Brand Strategy & Positioning': { zh: '品牌战略与定位', ms: 'Strategi & Kedudukan Jenama' },
  'Social Media Management': { zh: '社交媒体管理', ms: 'Pengurusan Media Sosial' },
  'Marketing Automation & CRM': { zh: '营销自动化与 CRM', ms: 'Automasi Pemasaran & CRM' },
  'Public Relations & Communications': { zh: '公共关系与传播', ms: 'Perhubungan Awam & Komunikasi' },
  'Data & Analytics (Marketing)': { zh: '数据与分析（营销）', ms: 'Data & Analitik (Pemasaran)' },

  'Contract Drafting & Review': { zh: '合同起草与审阅', ms: 'Penggubalan & Semakan Kontrak' },
  'Corporate & Compliance Advisory': { zh: '企业与合规咨询', ms: 'Nasihat Korporat & Pematuhan' },
  'Employment Law Advisory': { zh: '劳动法咨询', ms: 'Nasihat Undang-undang Pekerjaan' },
  'Intellectual Property': { zh: '知识产权', ms: 'Harta Intelek' },
  'Data Protection & Privacy (PDPA/GDPR)': { zh: '数据保护与隐私 (PDPA/GDPR)', ms: 'Perlindungan Data & Privasi (PDPA/GDPR)' },
  'Dispute Resolution Support': { zh: '争议解决支持', ms: 'Sokongan Penyelesaian Pertikaian' },
  'Common Reporting Standards': { zh: '共同申报准则', ms: 'Piawaian Pelaporan Bersama' },

  'Fractional Sales Director / Head of Sales': { zh: '兼职销售总监 / 销售主管', ms: 'Pengarah Jualan Sambilan / Ketua Jualan' },
  'Lead Generation & Prospecting': { zh: '线索开发与客户拓展', ms: 'Penjanaan Lead & Prospek' },
  'Business Development / Partnerships': { zh: '业务拓展 / 合作伙伴', ms: 'Pembangunan Perniagaan / Perkongsian' },
  'Sales Enablement & Training': { zh: '销售赋能与培训', ms: 'Pemerkasaan & Latihan Jualan' },
  'Account Management': { zh: '客户管理', ms: 'Pengurusan Akaun' },
  'Data & Analytics (Sales)': { zh: '数据与分析（销售）', ms: 'Data & Analitik (Jualan)' },

  'Business Strategy & Growth Planning': { zh: '业务战略与增长规划', ms: 'Strategi Perniagaan & Perancangan Pertumbuhan' },
  'Project Management Office (PMO)': { zh: '项目管理办公室 (PMO)', ms: 'Pejabat Pengurusan Projek (PMO)' },
  'Process Improvement / Operations Consulting': { zh: '流程改进 / 运营咨询', ms: 'Penambahbaikan Proses / Perundingan Operasi' },
  'Change Management': { zh: '变革管理', ms: 'Pengurusan Perubahan' },
  'Mergers & Acquisitions Advisory': { zh: '并购咨询', ms: 'Nasihat Penggabungan & Pengambilalihan' },
  'Sustainability & ESG Consulting': { zh: '可持续发展与 ESG 咨询', ms: 'Perundingan Kemampanan & ESG' },
  'Data & Analytics (Strategy)': { zh: '数据与分析（战略）', ms: 'Data & Analitik (Strategi)' },

  'Supply Chain & Logistics': { zh: '供应链与物流', ms: 'Rantaian Bekalan & Logistik' },
  'Operations Management': { zh: '运营管理', ms: 'Pengurusan Operasi' },
  Procurement: { zh: '采购', ms: 'Perolehan' },
  'Quality Assurance / Compliance Ops': { zh: '质量保证 / 合规运营', ms: 'Jaminan Kualiti / Operasi Pematuhan' },
  'Facilities & Admin Operations': { zh: '设施与行政运营', ms: 'Operasi Kemudahan & Pentadbiran' },
  'Data & Analytics (Operations)': { zh: '数据与分析（运营）', ms: 'Data & Analitik (Operasi)' },

  'Corporate Workshop Facilitation': { zh: '企业工作坊主持', ms: 'Fasilitasi Bengkel Korporat' },
  'Curriculum & Course Design': { zh: '课程与教学设计', ms: 'Reka Bentuk Kurikulum & Kursus' },
  'Executive Coaching': { zh: '高管教练', ms: 'Bimbingan Eksekutif' },
  'Compliance Training': { zh: '合规培训', ms: 'Latihan Pematuhan' },

  'Brand & Visual Identity': { zh: '品牌与视觉识别', ms: 'Jenama & Identiti Visual' },
  'UX/UI Design': { zh: 'UX/UI 设计', ms: 'Reka Bentuk UX/UI' },
  'Presentation & Pitch Deck Design': { zh: '演示文稿与路演材料设计', ms: 'Reka Bentuk Pembentangan & Pitch Deck' },
}

/** Display name for a category or sub-category in the active language. */
export function categoryLabel(name: string): string {
  const loc = currentLocale()
  if (loc !== 'zh' && loc !== 'ms') return name
  return NAMES[name]?.[loc] ?? name
}
