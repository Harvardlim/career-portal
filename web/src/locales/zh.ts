import type { TranslationKey } from './en'

// 中文 (Simplified Chinese). Anything missing falls back to English key by key.
export const zh: Partial<Record<TranslationKey, string>> = {
  // Nav
  'nav.home': '首页',
  'nav.businesses': '企业专区',
  'nav.experts': '专家专区',
  'nav.categories': '服务类别',
  'nav.how': '运作方式',
  'nav.login': '登录',
  'nav.signup': '注册',
  'nav.postFree': '免费发布您的项目',
  'nav.dashboard': '控制台',

  // Home / hero
  'hero.headline': '快速找到合适的专家，解决您的难题——免费发布，合适才聘用。',
  'hero.sub':
    'partly.asia 为企业匹配涵盖人力资源、IT、财务、市场营销、法律、销售、战略、运营等领域的已验证兼职专家——免费发布，只有当企业真正感兴趣时才需付费。',
  'hero.ctaPrimary': '免费发布您的项目',
  'hero.ctaSecondary': '以专家身份浏览',
  'hero.toggle.business': '我是企业',
  'hero.toggle.expert': '我是专家',
  'trust.verified': '企业与专家均已验证',
  'trust.matched': '智能匹配，无需大海捞针',
  'trust.pay': '仅为真实有意向的线索付费',
  'how.title': '运作方式',
  'how.step1': '发布需求',
  'how.step2': '获得匹配',
  'how.step3': '企业公开联系方式',
  'how.step4': '直接联系',
  'home.verticals': '企业所需的各类职能，一站满足',

  // For Businesses
  'biz.headline': '发布项目，结识专家，解决难题。',
  'biz.sub':
    '从人力资源到 IT，从财务到战略——描述您的需求，我们将根据您的项目和预算，为您匹配经过预先验证的专家。发布完全免费。',
  'biz.step1.title': '发布需求',
  'biz.step1.body': '填写项目简介、预算、时间表和项目类型，只需几分钟。',
  'biz.step2.title': '查看匹配结果',
  'biz.step2.body': '最多 10 位合格专家，每个发布仅抽取一次。',
  'biz.step3.title': '选择联系对象',
  'biz.step3.body': '公开联系方式——无需费用，无任何义务。仅限已匹配的合格专家。',
  'biz.step4.title': '直接联系',
  'biz.step4.body': '专家接受后，即可获得对方的完整联系方式。',
  'biz.trust':
    'partly.asia 上的每位专家都已通过身份验证，每家企业都已通过注册验证。您无需猜测对方是谁。',
  'biz.cta': '免费发布您的项目',
  'biz.scarcity': '这些是您本次发布的唯一匹配结果——请谨慎选择。',

  // For Experts
  'exp.headline': '真实线索，真实企业，由您决定。',
  'exp.sub':
    '无论您是顾问、培训师、人力资源专员还是兼职高管——申请与您专长相符的项目，只有当企业真正对您感兴趣时，才为优质线索付费。',
  'exp.step1.title': '创建个人档案',
  'exp.step1.body': '类似 LinkedIn 的档案——展示您的经验。',
  'exp.step2.title': '申请项目',
  'exp.step2.body': '浏览所有类别下的开放需求。',
  'exp.step3.title': '接收优质线索通知',
  'exp.step3.body': '当企业表现出真实兴趣时通知您。',
  'exp.step4.title': '仅为真实意向付费',
  'exp.step4.body': '只需支付少量固定费用即可解锁联系方式，且仅在企业表达意向之后。',
  'exp.trust':
    '您绝不会为自己没有选择跟进的线索付费。若线索失效，我们会通知您——而您不会为此支付一分钱。',
  'exp.cta': '创建专家档案',
  'exp.browse': '浏览开放需求',

  // Categories
  'cat.headline': '企业所需的各类职能，尽在一处。',
  'cat.sub': '从日常人力资源支持到战略性财务领导，浏览下方类别，了解 partly.asia 上可提供的专业能力。',
  'cat.entry.business': '想要聘请专家？在此类别发布需求',
  'cat.entry.expert': '您是此类别的专家吗？申请后查看开放需求',
  'cat.tile.business': '在{category}方面需要帮助？免费发布您的项目 →',
  'cat.tile.expert': '从事{category}工作？查看开放需求 →',
  'cat.expand': '查看子类别',
  'cat.collapse': '收起子类别',

  // Pricing / How payment works
  'pay.headline': '简单、公平，只在关键时刻收费。',
  'pay.sub': '企业发布和浏览永远免费。专家只需支付少量固定费用——而且只在企业亲自选择公开联系方式之后。',
  'pay.step1.title': '发布或浏览',
  'pay.step1.body': '完全免费，永远如此。',
  'pay.step2.title': '获得匹配',
  'pay.step2.body': '查看或申请真实的机会。',
  'pay.step3.title': '仅为真实意向付费',
  'pay.step3.body': '固定且透明的费用，仅在企业选择您之后收取。',
  'pay.compare1': '仅为一般猎头或项目费用（年薪的 15–25%）的一小部分',
  'pay.compare2': '远低于自行投放获客广告的成本',
  'pay.table.title': '各国固定费用',
  'pay.table.country': '国家/地区',
  'pay.table.lead': '每条已公开线索',
  'pay.table.badge': '全面验证徽章／每年',
  'pay.table.note': '当地价格按市场固定，按所示金额准确收取。您也可在结账时选择美元价格，外汇差价由我们承担。',
  'pay.detect': '正在显示{country}的价格。不正确？',
  'pay.badge.note': '“全面验证”徽章为可选项。它会增加资质层面的核查，并在匹配排名中获得优先，吸引更多有意向的线索。',

  // Trust & verification
  'trust.headline': '双方均已验证，每一次都是。',
  'trust.business.title': '我们如何验证企业',
  'trust.business.body':
    '每家企业都需使用有效的商业注册号注册，初始为“基础验证”。启用付费徽章并通过人工审核注册文件的企业将成为“全面验证”——这是吸引更优秀专家的标志。',
  'trust.business.point1': '按国家/地区验证的注册号',
  'trust.business.point2': '全面验证：注册文件由我们的团队审核',
  'trust.business.point3': '核查网站及公开信息',
  'trust.expert.title': '我们如何验证专家',
  'trust.expert.body':
    '每位专家在申请任何项目之前都必须验证身份（基础验证）。希望获得额外信任标识的专家可选择进行“全面验证”的资质核查。',
  'trust.expert.point1': '本地身份证件核查——号码经加密，绝不显示',
  'trust.expert.point2': '全面验证：身份证件由我们的团队审核',
  'trust.expert.point3': '可选择每年购买“全面验证”徽章，进行资质层面的核查',
  'faq.title': '常见问题',
  'faq.q1': '如果线索失效了怎么办？',
  'faq.a1': '我们会立即通知您，且您不会为未解锁的线索付费。',
  'faq.q2': '同一条线索可以公开给多位专家吗？',
  'faq.a2': '可以——如果您是多位被考虑的对象之一，我们会事先告知您。',
  'faq.q3': '我的身份证信息安全吗？',
  'faq.a3':
    '出于数据安全考虑，我们只收集您身份证号码的最后 4 位，存储前会先加密，并且绝不向任何人显示——包括您本人、企业和第三方。',
  'faq.q4': '企业公开联系方式后，我有多长时间解锁？',
  'faq.a4': '自企业公开联系方式起 2 天内。逾期线索将自动失效——不收取任何费用。',
  'faq.q5': '如果企业关闭了职位会怎样？',
  'faq.a5': '该发布下所有未结束的付款窗口会同时关闭，因此没有人会为已被填补的职位付费。已解锁的联系方式在到期前仍然可见。',
  'faq.q6': '联系方式可以查看多久？',
  'faq.a6': '5 个自然日，仅限在 partly.asia 上查看。双方会同时收到对方的联系信息。',

  // Sharing
  'share.badge.text': '在 partly.asia 上聘请我',
  'share.badge.prompt': '将此添加到您的 LinkedIn 档案，让企业可以直接找到您并申请合作。',
  'share.invite.business': '认识其他需要专家协助、但预算有限的企业主吗？邀请他们免费发布第一个项目。',
  'share.invite.expert': '认识其他需要更多线索的专家、顾问或培训师吗？邀请他们加入，开始接收优质线索。',

  // Affiliate program
  'aff.headline': '分享对您有用的服务，赚取收益。',
  'aff.sub':
    '无论您是企业、专家，还是认可 partly.asia 的普通用户——推荐他人，每当您的推荐带来真实成果，即可赚取佣金。',
  'aff.card1.title': '认证徽章推荐',
  'aff.card1.tag': '持续收益——每年',
  'aff.card1.body': '每当您推荐的人购买或续订认证徽章，您都可获得佣金——只要对方每年续订，您就持续获得收益。',
  'aff.card2.title': '成功线索推荐',
  'aff.card2.tag': '一次性——每条线索',
  'aff.card2.body': '每当您推荐的人成功解锁一条优质线索，您即可获得一次性佣金。很简单：对方成功，您就有收益。',
  'aff.how.title': '运作方式',
  'aff.how1': '从控制台获取您的专属推荐链接。',
  'aff.how2': '通过 WhatsApp、LinkedIn、电子邮件等方式自行分享。',
  'aff.how3': '当推荐带来真实成果时，自动获得固定佣金。',
  'aff.cta': '获取您的推荐链接',
  'aff.table.title': '各国固定佣金',
  'aff.table.full': '原价',
  'aff.table.you': '您的收益',
  'aff.payout': '推荐佣金以美元支付，扣除外汇及交易手续费，余额达到 50 美元后结算。',
  'aff.attribution': '归属按首次点击计算且永久有效——平台绝不会代您联系被推荐方。',

  // Footer
  'footer.tagline': '已验证的专家，匹配东南亚各地真实的企业需求。',
  'footer.business': '企业专区',
  'footer.expert': '专家专区',
  'footer.company': '公司',
  'footer.trust': '信任与验证',
  'footer.affiliate': '联盟推广计划',
  'footer.pricing': '付款方式',
  'footer.contact': '联系我们',
  'footer.terms': '服务条款',
  'footer.privacy': '隐私政策',
  'footer.rights': '© {year} partly.asia。保留所有权利。',

  // Language switcher
  'lang.label': '语言',
  'lang.comingSoon': '即将推出',
}
