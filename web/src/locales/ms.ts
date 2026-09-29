import type { TranslationKey } from './en'
import { msUi } from './ms.ui'

// Bahasa Melayu. Anything missing falls back to English key by key.
export const ms: Partial<Record<TranslationKey, string>> = {
  // Nav
  'nav.home': 'Laman Utama',
  'nav.businesses': 'Untuk Perniagaan',
  'nav.experts': 'Untuk Pakar',
  'nav.categories': 'Kategori',
  'nav.how': 'Cara Ia Berfungsi',
  'nav.login': 'Log Masuk',
  'nav.signup': 'Daftar',
  'nav.postFree': 'Siarkan Projek Anda ,  Percuma',
  'nav.dashboard': 'Papan Pemuka',

  // Home / hero
  'hero.headline': 'Pakar yang tepat, dengan pantas. Selesaikan masalah anda ,  siarkan percuma, upah hanya apabila sesuai.',
  'hero.sub':
    'partly.asia memadankan perniagaan dengan pakar sambilan yang disahkan dalam bidang HR, IT, Kewangan, Pemasaran, Undang-undang, Jualan, Strategi, Operasi dan banyak lagi ,  siarkan percuma, bayar hanya apabila sesebuah perniagaan benar-benar berminat.',
  'hero.ctaPrimary': 'Siarkan Projek Anda ,  Percuma',
  'hero.ctaSecondary': 'Layari sebagai Pakar',
  'hero.toggle.business': 'Saya Perniagaan',
  'hero.toggle.expert': 'Saya Pakar',
  'trust.verified': 'Perniagaan & Pakar Yang Disahkan',
  'trust.matched': 'Dipadankan, Bukan Dicari',
  'trust.pay': 'Bayar Hanya untuk Lead Yang Benar-benar Berminat',
  'how.title': 'Cara ia berfungsi',
  'how.step1': 'Siarkan keperluan anda',
  'how.step2': 'Dapatkan padanan',
  'how.step3': 'Perniagaan melepaskan hubungan',
  'how.step4': 'Berhubung secara terus',
  'home.verticals': 'Setiap fungsi yang diperlukan perniagaan anda',

  // For Businesses
  'biz.headline': 'Siarkan projek anda. Temui pakar anda. Selesaikan masalah anda.',
  'biz.sub':
    'Daripada HR hingga IT, Kewangan hingga Strategi ,  terangkan apa yang anda perlukan, dan kami akan memadankan anda dengan pakar yang telah disahkan dan bersedia membantu - mengikut projek dan bajet anda. Menyiarkan projek adalah percuma sepenuhnya.',
  'biz.step1.title': 'Siarkan keperluan anda',
  'biz.step1.body': 'Ringkasan projek, bajet, garis masa, jenis projek ,  hanya mengambil beberapa minit.',
  'biz.step2.title': 'Semak padanan anda',
  'biz.step2.body': 'Sehingga 10 pakar yang layak, dipilih sekali sahaja untuk siaran anda.',
  'biz.step3.title': 'Pilih siapa yang ingin dihubungi',
  'biz.step3.body': 'Lepaskan hubungan ,  tanpa kos, tanpa kewajipan. Hanya pakar layak yang dipadankan.',
  'biz.step4.title': 'Berhubung secara terus',
  'biz.step4.body': 'Dapatkan butiran hubungan penuh mereka sebaik sahaja mereka bersetuju.',
  'biz.trust':
    'Setiap pakar di partly.asia disahkan identitinya. Setiap perniagaan disahkan pendaftarannya. Anda tidak perlu meneka siapa di sebelah sana.',
  'biz.cta': 'Siarkan Projek Anda ,  Percuma',
  'biz.scarcity': 'Ini sahaja padanan anda untuk siaran ini ,  pilih dengan teliti.',

  // For Experts
  'exp.headline': 'Lead sebenar. Perniagaan sebenar. Anda yang memilih.',
  'exp.sub':
    'Sama ada anda seorang perunding, jurulatih, pakar HR atau eksekutif sambilan ,  mohon projek yang sesuai dengan kepakaran anda, dan bayar untuk lead hangat hanya apabila sesebuah perniagaan benar-benar berminat dengan anda.',
  'exp.step1.title': 'Cipta profil anda',
  'exp.step1.body': 'Gaya LinkedIn ,  tonjolkan pengalaman anda.',
  'exp.step2.title': 'Mohon projek',
  'exp.step2.body': 'Layari keperluan terbuka merentas semua kategori.',
  'exp.step3.title': 'Dimaklumkan tentang lead hangat',
  'exp.step3.body': 'Apabila sesebuah perniagaan menunjukkan minat sebenar.',
  'exp.step4.title': 'Bayar hanya untuk minat sebenar',
  'exp.step4.body': 'Yuran tetap yang kecil membuka hubungan, hanya selepas minat ditunjukkan.',
  'exp.trust':
    'Anda tidak akan membayar untuk lead yang anda tidak pilih untuk diteruskan. Jika sesuatu lead menjadi dingin, anda akan dimaklumkan ,  dan anda tidak membayar sesen pun.',
  'exp.cta': 'Cipta Profil Pakar Anda',
  'exp.browse': 'Layari keperluan terbuka',

  // Categories
  'cat.headline': 'Setiap fungsi yang diperlukan perniagaan anda ,  di satu tempat.',
  'cat.sub':
    'Daripada sokongan HR harian hingga kepimpinan kewangan strategik, layari kategori di bawah untuk melihat jenis kepakaran yang terdapat di partly.asia.',
  'cat.entry.business': 'Ingin mengambil pekerja? Siarkan keperluan dalam kategori ini',
  'cat.entry.expert': 'Anda pakar dalam kategori ini? Mohon untuk melihat keperluan terbuka',
  'cat.tile.business': 'Perlukan bantuan dalam {category}? Siarkan projek anda percuma →',
  'cat.tile.expert': 'Bekerja dalam {category}? Lihat keperluan terbuka →',
  'cat.expand': 'Lihat subkategori',
  'cat.collapse': 'Sembunyikan subkategori',

  // Pricing / How payment works
  'pay.headline': 'Mudah, adil, dan hanya apabila ia penting.',
  'pay.sub':
    'Perniagaan tidak pernah membayar untuk menyiar atau melayari. Pakar membayar yuran tetap yang kecil ,  dan hanya selepas sesebuah perniagaan memilih sendiri untuk melepaskan hubungan.',
  'pay.step1.title': 'Siar atau layari',
  'pay.step1.body': 'Percuma sepenuhnya, sentiasa.',
  'pay.step2.title': 'Dapatkan padanan',
  'pay.step2.body': 'Lihat atau mohon peluang sebenar.',
  'pay.step3.title': 'Bayar hanya untuk minat sebenar',
  'pay.step3.body': 'Yuran tetap yang telus, hanya apabila sesebuah perniagaan memilih anda.',
  'pay.compare1': 'Sebahagian kecil daripada yuran perekrut atau projek biasa (15–25% daripada gaji tahunan)',
  'pay.compare2': 'Jauh lebih murah daripada menjalankan pengiklanan penjanaan lead sendiri',
  'pay.table.title': 'Yuran tetap mengikut negara',
  'pay.table.country': 'Negara',
  'pay.table.lead': 'Setiap lead yang dilepaskan',
  'pay.table.badge': 'Lencana Disahkan Sepenuhnya / tahun',
  'pay.table.note':
    'Harga tempatan ditetapkan bagi setiap pasaran dan dikenakan tepat seperti yang ditunjukkan. Angka USD ialah alternatif yang boleh anda pilih semasa pembayaran ,  kadar pertukaran ditanggung oleh kami.',
  'pay.detect': 'Menunjukkan harga untuk {country}. Tidak tepat?',
  'pay.badge.note': 'Lencana Disahkan Sepenuhnya adalah pilihan. Ia menambah semakan peringkat kelayakan dan keutamaan dalam kedudukan padanan ,  serta menarik lebih ramai lead yang berminat.',

  // Trust & verification
  'trust.headline': 'Disahkan di kedua-dua belah pihak. Setiap kali.',
  'trust.business.title': 'Cara kami mengesahkan perniagaan',
  'trust.business.body':
    'Setiap perniagaan mendaftar dengan nombor pendaftaran perniagaan yang sah dan bermula sebagai Disahkan Asas. Perniagaan yang mengaktifkan lencana berbayar dan dokumen pendaftarannya disemak secara manual menjadi Disahkan Sepenuhnya ,  tanda yang menarik pakar yang lebih baik.',
  'trust.business.point1': 'Nombor pendaftaran, disahkan mengikut negara',
  'trust.business.point2': 'Disahkan Sepenuhnya: dokumen pendaftaran disemak oleh pasukan kami',
  'trust.business.point3': 'Laman web dan kehadiran awam disemak',
  'trust.expert.title': 'Cara kami mengesahkan pakar',
  'trust.expert.body':
    'Setiap pakar mengesahkan identiti mereka (Disahkan Asas) sebelum memohon sebarang projek. Semakan kelayakan Disahkan Sepenuhnya yang pilihan tersedia untuk pakar yang mahukan isyarat kepercayaan tambahan.',
  'trust.expert.point1': 'Semakan ID tempatan ,  digit disulitkan dan tidak pernah dipaparkan',
  'trust.expert.point2': 'Disahkan Sepenuhnya: dokumen ID disemak oleh pasukan kami',
  'trust.expert.point3': 'Lencana Disahkan Sepenuhnya tahunan yang pilihan untuk semakan peringkat kelayakan',
  'faq.title': 'Soalan yang paling kerap kami terima',
  'faq.q1': 'Bagaimana jika lead saya menjadi dingin?',
  'faq.a1': 'Anda dimaklumkan serta-merta, dan anda tidak pernah dicaj untuk lead yang tidak anda buka.',
  'faq.q2': 'Bolehkah lead yang sama dilepaskan kepada beberapa pakar?',
  'faq.a2': 'Boleh ,  anda akan sentiasa dimaklumkan di awal jika anda antara beberapa pakar yang dipertimbangkan.',
  'faq.q3': 'Adakah maklumat ID saya selamat?',
  'faq.a3':
    'Atas sebab keselamatan data, kami hanya mengumpul 4 aksara terakhir ID anda, menyulitkannya sebelum disimpan, dan tidak pernah memaparkannya kepada sesiapa ,  bukan kepada anda, bukan kepada perniagaan, bukan kepada pihak ketiga',
  'faq.q4': 'Berapa lama masa yang saya ada untuk membuka hubungan yang dilepaskan?',
  'faq.a4': '2 hari dari saat perniagaan melepaskan hubungan. Selepas itu lead akan menjadi dingin ,  tanpa sebarang caj.',
  'faq.q5': 'Apa yang berlaku jika perniagaan menutup kerja tersebut?',
  'faq.a5':
    'Setiap tetingkap pembayaran yang terbuka pada siaran itu berakhir serentak, supaya tiada sesiapa membayar untuk jawatan yang sudah diisi. Hubungan yang telah dibuka kekal kelihatan sehingga tamat tempoh.',
  'faq.q6': 'Berapa lama saya boleh melihat butiran hubungan?',
  'faq.a6': '5 hari kalendar, di partly.asia sahaja. Kedua-dua pihak menerima butiran satu sama lain pada masa yang sama.',

  // Sharing
  'share.badge.text': 'Upah saya di partly.asia',
  'share.badge.prompt': 'Tambahkan ini pada profil LinkedIn anda supaya perniagaan boleh mencari dan memohon untuk bekerja dengan anda secara terus.',
  'share.invite.business':
    'Kenal pemilik perniagaan lain yang memerlukan bantuan pakar pada sebahagian kecil daripada kos pasaran? Jemput mereka menyiarkan projek pertama mereka secara percuma.',
  'share.invite.expert':
    'Kenal pakar, perunding atau jurulatih lain yang memerlukan lebih banyak lead? Jemput mereka menyertai dan mula menerima lead hangat.',

  // Affiliate program
  'aff.headline': 'Jana pendapatan dengan berkongsi apa yang sudah berkesan untuk anda.',
  'aff.sub':
    'Sama ada anda perniagaan, pakar, atau sesiapa yang percaya pada partly.asia ,  rujuk orang lain dan dapatkan komisen setiap kali rujukan anda menghasilkan keputusan sebenar.',
  'aff.card1.title': 'Rujukan Lencana Disahkan',
  'aff.card1.tag': 'Berulang ,  setiap tahun',
  'aff.card1.body':
    'Dapatkan komisen setiap kali orang yang anda rujuk membeli atau memperbaharui Lencana Disahkan ,  dan terus menerimanya setiap tahun mereka memperbaharui.',
  'aff.card2.title': 'Rujukan Lead Berjaya',
  'aff.card2.tag': 'Sekali sahaja ,  bagi setiap lead',
  'aff.card2.body':
    'Dapatkan komisen sekali sahaja setiap kali orang yang anda rujuk berjaya membuka lead hangat. Mudah: mereka berjaya, anda mendapat pendapatan.',
  'aff.how.title': 'Cara ia berfungsi',
  'aff.how1': 'Dapatkan pautan rujukan unik anda daripada papan pemuka.',
  'aff.how2': 'Kongsikan sendiri ,  WhatsApp, LinkedIn, e-mel.',
  'aff.how3': 'Dapatkan komisen tetap secara automatik apabila rujukan menghasilkan keputusan sebenar.',
  'aff.cta': 'Dapatkan Pautan Rujukan Anda',
  'aff.table.title': 'Komisen tetap mengikut negara',
  'aff.table.full': 'Harga penuh',
  'aff.table.you': 'Anda dapat',
  'aff.payout': 'Rujukan dibayar dalam USD, tolak kos FX dan yuran transaksi, apabila baki anda melepasi USD 50.',
  'aff.attribution': 'Atribusi adalah klik pertama dan kekal ,  platform tidak pernah menghubungi pihak yang dirujuk bagi pihak anda.',

  // Footer
  'footer.tagline': 'Pakar yang disahkan, dipadankan dengan keperluan perniagaan sebenar di seluruh Asia Tenggara.',
  'footer.business': 'Untuk Perniagaan',
  'footer.expert': 'Untuk Pakar',
  'footer.company': 'Syarikat',
  'footer.trust': 'Kepercayaan & Pengesahan',
  'footer.affiliate': 'Program Affiliate',
  'footer.pricing': 'Cara Pembayaran Berfungsi',
  'footer.contact': 'Hubungi Kami',
  'footer.terms': 'Terma',
  'footer.privacy': 'Dasar Privasi',
  'footer.rights': '© {year} partly.asia. Hak cipta terpelihara.',

  // Language switcher
  'lang.label': 'Bahasa',
  'lang.comingSoon': 'akan datang',

  ...msUi,
}
