import type { LegalOverride } from './terms.zh'

// Terjemahan Bahasa Melayu, dipadankan mengikut id seksyen dengan versi Inggeris.
// Untuk rujukan sahaja , sila dapatkan penasihat undang-undang/privasi menyemaknya sebelum digunakan secara komersial.
export const privacyMs: Record<string, LegalOverride> = {
  overview: {
    title: 'Gambaran Keseluruhan',
    body: [
      'Dasar Privasi ini menerangkan data peribadi yang dikumpul oleh partly.asia ("kami") melalui Platform, bagaimana kami menggunakan dan berkongsinya, serta pilihan dan hak yang anda ada. Ia terpakai kepada Perniagaan, Pakar dan pelawat partly.asia.',
      'Ia hendaklah dibaca bersama ',
    ],
  },
  collect: {
    title: 'Maklumat Yang Kami Kumpul',
    intro: 'Kami mengumpul maklumat yang anda berikan secara terus, maklumat yang dijana melalui penggunaan Platform, dan maklumat daripada perkhidmatan pihak ketiga yang kami gunakan.',
    bullets: [
      'Maklumat akaun , nama, alamat e-mel, nombor telefon, kata laluan (disimpan dalam bentuk hash, tidak pernah dalam teks biasa), dan bagi Perniagaan: nama syarikat dan nombor pendaftaran.',
      'Pengesahan identiti (Pakar) , 4 aksara terakhir dokumen ID tempatan yang diiktiraf (NRIC/FIN, MyKad, KTP, ID Kebangsaan Thai, atau CCCD). Ini disulitkan sebelum disimpan menggunakan kunci yang tidak pernah disimpan bersama data itu sendiri, dan tidak pernah dipaparkan semula kepada anda, mana-mana Perniagaan, atau mana-mana pihak ketiga, termasuk kakitangan kami sendiri.',
      'Dokumen pengesahan , salinan dokumen identiti (untuk Lencana Disahkan Pakar yang pilihan) atau dokumen pendaftaran perniagaan (diperlukan untuk Perniagaan menyiarkan). Ini disimpan di lokasi persendirian, disemak hanya oleh pasukan pengesahan kami, dan tidak pernah dipaparkan secara awam.',
      'Kandungan profil & siaran , tajuk ringkas, pengalaman kerja, kategori/kemahiran, pautan portfolio, URL LinkedIn, fail resume/CV, foto profil, dan butiran mana-mana projek yang disiarkan oleh Perniagaan.',
      'Butiran hubungan , e-mel, nombor telefon dan maklumat hubungan lain yang diberikan oleh Perniagaan atau Pakar, yang hanya dikongsi dengan pihak yang dipadankan selepas Perniagaan melepaskan hubungan dan Pakar membayar untuk membukanya (lihat "Bagaimana Kami Berkongsi Maklumat" di bawah).',
      'Maklumat pembayaran , dikendalikan terus oleh Stripe, pemproses pembayaran kami. Kami menerima pengesahan bahawa pembayaran berjaya dan metadata terhad (jumlah, mata wang, negara) tetapi tidak pernah nombor kad penuh anda.',
      'Data rujukan & affiliate , kod rujukan anda, siapa yang mendaftar melalui pautan anda, dan komisen yang diatribusikan kepada anda.',
      'Data penggunaan & peranti , halaman yang dilawati, tindakan yang diambil (cth. memohon Siaran), alamat IP, jenis pelayar, dan pengecam peranti, dikumpul secara automatik melalui teknologi web standard.',
      'Kuki & storan tempatan , digunakan untuk pengurusan sesi (kekal log masuk), mengingati pilihan bahasa anda, dan analitik asas. Lihat Seksyen 8.',
      'Komunikasi , mesej yang anda hantar kepada pasukan sokongan kami, dan laporan yang anda failkan tentang pengguna lain.',
    ],
  },
  use: {
    title: 'Bagaimana Kami Menggunakan Maklumat',
    intro: 'Kami menggunakan maklumat di atas untuk:',
    bullets: [
      'Mencipta dan mentadbir akaun anda, dan mengesahkan identiti atau pendaftaran perniagaan anda.',
      'Menjalankan algoritma padanan yang menyenarai pendek Pakar untuk sesuatu Siaran, dan menyusun pemegang Lencana Disahkan dengan keutamaan.',
      'Memproses pembayaran untuk Pembukaan hubungan atau Lencana Disahkan, dan membayar komisen affiliate.',
      'Menghantar komunikasi perkhidmatan , contohnya, bahawa Perniagaan telah melepaskan hubungan kepada anda, bahawa tetingkap pembayaran hampir ditutup, atau bahawa Lencana Disahkan anda akan tamat tempoh. Ini mesej operasi, bukan pemasaran, dan tidak boleh dinyahaktifkan selagi anda memegang akaun.',
      'Menghantar komunikasi pemasaran pilihan, yang boleh anda tolak pada bila-bila masa.',
      'Menyiasat laporan penyalahgunaan, menguatkuasakan Terma kami, dan memastikan Platform selamat.',
      'Menambah baik Platform , contohnya, memahami kategori mana yang paling banyak diminta.',
      'Mematuhi obligasi undang-undang, seperti menjawab permintaan sah daripada pengawal selia atau penguat kuasa undang-undang.',
    ],
  },
  share: {
    title: 'Bagaimana Kami Berkongsi Maklumat',
    body: ['Kami tidak menjual data peribadi anda.'],
    bullets: [
      'Dengan pihak yang dipadankan , butiran hubungan penuh Perniagaan dikongsi dengan Pakar, dan butiran hubungan penuh Pakar dikongsi dengan Perniagaan itu, hanya selepas Perniagaan melepaskan hubungan dan Pakar membayar untuk membukanya. Di luar itu, Perniagaan hanya melihat kad padanan (nama, tajuk ringkas, pengalaman, status pengesahan) dan tidak pernah butiran hubungan Pakar, dan Pakar tidak pernah melihat nama sebenar atau butiran hubungan Perniagaan pada Siaran sehingga mereka membukanya.',
      'Dengan pembekal perkhidmatan yang memproses data bagi pihak kami di bawah kontrak, termasuk Stripe (pembayaran), Resend (e-mel transaksi), dan pembekal hos awan/pangkalan data kami. Pembekal ini hanya diberikan data yang mereka perlukan untuk melaksanakan fungsi mereka.',
      'Atas sebab undang-undang , jika diperlukan untuk mematuhi undang-undang, peraturan, proses undang-undang, atau permintaan sah oleh pihak berkuasa awam.',
      'Dalam pemindahan perniagaan , jika partly.asia terlibat dalam penggabungan, pengambilalihan atau penjualan aset, maklumat anda mungkin dipindahkan sebagai sebahagian daripada transaksi itu, tertakluk kepada Dasar ini atau dasar pengganti yang perlindungannya tidak kurang.',
      'Dengan persetujuan anda , untuk sebarang tujuan lain yang kami terangkan kepada anda pada masa itu.',
    ],
  },
  'contact-window': {
    title: 'Pertukaran Hubungan & Tetingkap 5 Hari',
    body: [
      'Apabila hubungan yang dilepaskan dibuka, butiran hubungan kedua-dua pihak menjadi kelihatan antara satu sama lain di Platform selama 5 hari kalendar. Selepas tetingkap itu, butiran tidak lagi dipaparkan di Platform (walaupun sudah tentu mana-mana pihak mungkin telah menyimpannya, kerana penglibatan seterusnya berlaku di luar platform mengikut Terma kami).',
      'Demi keselamatan dan privasi, kami meminta kedua-dua pihak merujuk lead hanya melalui Platform semasa tetingkap terbuka, dan tidak pernah melalui pemajuan e-mel butiran hubungan.',
    ],
  },
  retention: {
    title: 'Pengekalan Data',
    body: [
      'Kami menyimpan maklumat akaun dan profil anda selagi akaun anda aktif, dan untuk tempoh yang munasabah selepas itu bagi mematuhi obligasi undang-undang, perakaunan, atau penyelesaian pertikaian.',
      'Dokumen identiti dan dokumen pendaftaran perniagaan yang dimuat naik dipadam secara automatik 90 hari selepas pasukan kami membuat keputusan (diluluskan atau ditolak) , kami hanya menyimpan rekod keputusan (diluluskan/ditolak, penyemak dan tarikh), tidak pernah fail itu sendiri, selepas itu. Ini pilihan yang disengajakan: ia mengehadkan jumlah data dokumen sensitif yang kami pegang pada bila-bila masa.',
      'Digit identiti yang disulitkan (4 aksara terakhir ID tempatan anda) disimpan selagi akaun anda aktif, kerana ia adalah cara pengesahan asas percuma anda direkodkan; ia tidak pernah dipaparkan kepada sesiapa dan dipadam apabila akaun anda ditutup.',
      'Jika anda menutup akaun anda, kami memadam atau menganonimkan data peribadi yang tidak lagi diperlukan, selain rekod yang kami dikehendaki simpan (contohnya, rekod pembayaran untuk tujuan cukai).',
    ],
  },
  rights: {
    title: 'Hak & Pilihan Anda',
    intro: 'Bergantung pada lokasi anda, anda mungkin berhak untuk:',
    bullets: [
      'Mengakses data peribadi yang kami pegang tentang anda.',
      'Membetulkan data yang tidak tepat atau tidak lengkap , kebanyakan medan profil boleh disunting terus dalam papan pemuka anda.',
      'Meminta pemadaman data anda, termasuk dengan menutup akaun anda daripada tetapan akaun.',
      'Keluar daripada program affiliate/rujukan pada bila-bila masa.',
      'Menolak komunikasi pemasaran melalui pautan berhenti melanggan dalam mana-mana e-mel pemasaran.',
      'Membantah atau menyekat pemprosesan tertentu, atau meminta salinan data anda yang boleh dipindahkan, jika undang-undang yang terpakai memperuntukkannya.',
    ],
  },
  cookies: {
    title: 'Kuki & Storan Tempatan',
    body: [
      'Kami menggunakan kuki dan storan tempatan pelayar untuk memastikan anda kekal log masuk, mengingati pilihan bahasa anda, dan memahami penggunaan asas Platform. Kami tidak menggunakan kuki untuk penyasaran iklan pihak ketiga. Anda boleh mengawal kuki melalui tetapan pelayar anda, walaupun sesetengah ciri Platform (seperti kekal log masuk) mungkin tidak berfungsi dengan betul jika anda mematikannya.',
    ],
  },
  security: {
    title: 'Keselamatan Data',
    body: [
      'Kami menggunakan perlindungan standard industri untuk melindungi maklumat anda, termasuk penyulitan data identiti sensitif, storan persendirian untuk dokumen pengesahan dengan akses terhad kepada pasukan pengesahan kami, dan kawalan akses peringkat baris dalam pangkalan data kami supaya pengguna hanya boleh melihat rekod yang mereka berhak lihat.',
      'Tiada sistem yang selamat sepenuhnya, dan kami tidak boleh menjamin keselamatan mutlak. Jika anda percaya akaun anda telah dikompromi, hubungi kami serta-merta.',
    ],
  },
  transfers: {
    title: 'Pemindahan Data Antarabangsa',
    body: [
      'partly.asia melayani Perniagaan di seluruh dunia dan Pakar yang berpangkalan di Singapura, Malaysia, Indonesia, Thailand, Vietnam dan Filipina. Data anda mungkin diproses pada pelayan yang terletak di luar negara anda sendiri, termasuk oleh pembekal perkhidmatan yang diterangkan dalam Seksyen 4. Jika perlu, kami mengambil langkah bertujuan memastikan pemindahan sedemikian tertakluk kepada perlindungan yang sesuai.',
    ],
  },
  children: {
    title: 'Privasi Kanak-kanak',
    body: [
      'Platform tidak ditujukan kepada, dan tidak bertujuan untuk digunakan oleh, sesiapa yang berumur di bawah 18 tahun. Kami tidak dengan sengaja mengumpul data peribadi daripada kanak-kanak. Jika anda percaya seorang kanak-kanak telah memberikan data peribadi kepada kami, hubungi kami dan kami akan mengambil langkah untuk memadamnya.',
    ],
  },
  changes: {
    title: 'Perubahan pada Dasar Ini',
    body: [
      'Kami boleh mengemas kini Dasar Privasi ini dari semasa ke semasa. Jika kami membuat perubahan ketara, kami akan memberikan notis yang munasabah (contohnya, melalui e-mel atau notis dalam aplikasi) sebelum ia berkuat kuasa. Tarikh "Kemas kini terakhir" di bahagian atas halaman ini sentiasa mencerminkan versi semasa.',
    ],
  },
  contact: {
    title: 'Hubungi Kami',
    body: ['Untuk sebarang soalan privasi, atau untuk menggunakan hak yang diterangkan dalam Seksyen 7, hubungi pasukan kami melalui '],
  },
}
