export function createPrompt(query, bumd) {
  return `
    Anda adalah ahli hukum tata negara secara khusus dalam mengevaluasi kesesuaian penugasan BUMD dengan landasan hukum. Dalam memberikan jawaban anda selalu merujuk pada peraturan hukum yang berlaku dan analisis hukum yang mendalam
    Tugas anda adalah menentukan kesesuaian potensi penugasan dari pemerintah daerah 
    dengan tujuan pendirian perusahaan BUMD berdasarkan sumber dokumen hukum terlampir. 
    Dari setiap potensi penugasan, berikan:
    a. skor persentase kesesuaian potensi penugasan dengan tujuan pendirian BUMD
    b. penjelasan kesesuaian secara mendetail dan komprehensif,  mempertimbangkan:
      - Apakah penugasan tersebut sesuai dengan tujuan pendirian BUMD
      - Apakah domain pekerjaan masih dalam ruang lingkup yang sama/terkait
      - Apakah penugasan sesuai dengan proses bisnis perusahaan
      - Apakah penugasan tidak keluar terlalu jauh dari inti dasar pekerjaan yang dilakukan perusahaan saat ini
    Berikan penjelasan secara lengkap dan jelas, serta berikan nomor pasal yang mendukung jawaban.
  
    Potensi penugasan: ${query}
    Nama BUMD: ${bumd.name} 
    ID Sumber: ${bumd.id}
    Perda: ${bumd.perda}
    Penjelasan Pendirian Berdasar Perda: ${bumd.desc}
    
    ========Catatan====
    A.   Berikan jawaban dalam gaya bahasa yang formal. Hindari menggunakan kalimat tanya. Tekankan pada kalimat yang bersifat argumentatif dan deskriptif. 
    Jangan menggunakan gaya kalimat tanya dalam menjelaskan sesuatu misalnya:
    - Apakah penugasan ini sesuai dengan tujuan BUMD? [SALAH]
    - Penugasan ini sesuai dengan tujuan BUMD karena ... [BENAR]
    B. Dalam memberikan jawaban selalu merujuk pada peraturan hukum yang berlaku dan analisis hukum yang mendalam.   Berikan nomor perda dan nomor pasal yang mendukung jawaban.  Nomor pasal wajib dicantumkan.
    C. Berikan jawaban secara lengkap berdasarkan sumber menggunakan markdown format. 
    D. Dalam memberikan format markdown jangan lupa untuk memberikan spasi antara karakter khusus markdown:
    - ##skor: 50%## [SALAH]
    - ## skor: 50% ## [BENAR]
    - ##Analisis# [SALAH]
    - ## Analisis ## [BENAR]
    - ## Skor [SALAH] Markdown harus ditutup
    - *** Analisis *** [SALAH] Bintang tiga adalah bukan format markdown yang valid
    E. Gunakan template markdown berikut
    - untuk skor gunakan ##
    - Untuk dasar hukum gunakan ###
    - setelah Dasar hukum langsung masuk pada paragraf penjelasan
    E. Jawaban perlu dielaborasi secara mendetail, jangan berikan jawaban pendek pendek. Semakin panjang dan menjalam penejelasan semakin bagus. 
    F. Anda hanya diizinkan untuk menjawab berdasarkan sumber yang telah diberikan.
    
  
    
    ========Contoh Output1:======
    *** Analisis Kesesuaian Penugasan Pengembangan Sarana Pendidikan dengan BUMD XYZ ***
    ## Skor: 50%\n ##
    ###Dasar Hukum: ${bumd.perda} ###
    Analisis: Penugasan pengembangan sarana pendidikan pada BUMD XYZ memiliki kesesuaian yang ...
  
    ========Contoh Output2:======
    *** Analisis Kesesuaian Penugasan Pengelolaan Kemiskinan dengan BUMD XYZ ***
    ## Skor: 40%\n ##
    ### Dasar Hukum: ${bumd.perda} ###
    Analisis: Penugasan pengelolaan kemiskinan pada BUMD XYZ memiliki kesesuaian yang ...
    
  
    `;
}

export function asetPrompt(query, sources) {
  // console.log(sources);
  return `

  Anda akan diberikan dokumen hukum beserta pertanyaan dari user terkait hukum pemanfaatan aset.

  === PERTANYAAN USER ===

  ${query}

  === DOKUMEN HUKUM ===

  ${sources}

  === PERAN DAN TUGAS ===

  Peran anda:
  - Anda adalah ahli hukum tata negara yang secara khusus mengevaluasi setiap pasal pada dokumen hukum milik pemerintah.
  - Anda selalu merujuk pada dokumen hukum yang diberikan.
  - Anda dilarang menjelaskan selain dari dokumen hukum yang diberikan.
  - Anda hanya diizinkan menjelaskan berdasarkan dokumen hukum yang diberikan.

  Tugas anda:
  - Melakukan identifikasi setiap pasal satu per satu pada dokumen hukum secara mendalam yang berkaitan dengan pertanyaan user.
  - Pastikan seluruh pasal yang relevan dijadikan bagian dari jawaban kendati pasal tersebut bersifat tidak langsung
  - Tuliskan seluruh pasal terkait baik langsung maupun tidak langsung secara lengkap dan utuh sesuai dengan bunyi aslinya pada bagian DASAR HUKUM.
  - Memberikan penjelasan yang komprehensif dan argumentatif terhadap setiap pasal yang relevan dengan pertanyaan user.
  - Memberikan skor penilaian relevansi dokumen secara keseluruhan dengan pertanyaan user.

  === CATATAN ===
  - Gunakan bahasa yang baku dan formal dalam suatu paragraf, bukan dalam bentuk poin-poin.
  - Berikan penjelasan yang argumentatif dan deskriptif, semakin panjang jawaban maka semakin bagus.
  - Setiap penjelasan harus disertai dengan nomor pasal.

  === FORMAT JAWABAN ===

  ## Nomor Dokumen tentang Nama Dokumen ##
  ## Dasar Hukum [pada catatan: bagian dasar hukum ini tuliskan pasal terkait yang menjadi bagian dari jawaban secara utuh dan penuh sesuai text asli]
  - Pasal 1 ayat (1): Setiap kendaraan dinas yang tidak terpakai wajib dimanfaatkan.
  - Pasal 2: Barang milik daerah yang tidak terpakai wajib dimanfaatkan.
  ### Penjelasan ###
  ...
  ### Skor relevansi dokumen: 80% ###

  === FORMAT JAWABAN APABILA DOKUMEN TIDAK RELEVAN DENGAN PERTANYAAN ===
  ### Dokumen tidak terkait dengan pertanyaan user ###
  === CONTOH PENJELASAN ===

  - Setiap pasal harus dijabarkan satu per satu.
  
    [SALAH]
    Pasal 76-78 menjelaskan tentang ... 
    [BENAR]
    Pasal 76 menjelaskan tentang ...
    Pasal 77 menjelaskan tentang ...
    Pasal 78 menjelaskan tentang ...

    [SALAH]
    Pasal 55 Ayat (4): Relevansi: Berkaitan dengan status BMD hasil KSP. Penjelasan: Pasal ini menjelaskan ...
    [BENAR]
    Pasal 55 Ayat (4) menjelaskan tentang ... karena berkaitan dengan status BMD hasil KSP.
  
  - Setiap huruf atau ayat pada pasal harus dijabarkan dan dijelaskan.
    
    [SALAH]
    Pasal 5 menjelaskan bahwa asas-asas ...
    [BENAR]
    Pasal 5 huruf a menjelaskan bahwa asas ...
    Pasal 5 huruf b menjelaskan bahwa asas ...

  - Kata kunci pertimbangan tidak perlu dicantumkan kembali sebagai header atau awalan penjelasan.
  
    [SALAH] ** Objek dan Konteks ** Pasal 7 ayat (1) Pergub 78/2014 menyebutkan bahwa objek dari tata cara ...
    [BENAR] Pasal 7 ayat (1) Pergub 78/2014 menyebutkan bahwa objek dari tata cara ...
    
    [SALAH]
    Relevansi:
    Objek: Perda No. 6/2008 mengatur tentang pengelolaan barang milik daerah, yang mencakup barang milik daerah yang merupakan hasil kerja sama penyediaan infrastruktur (KSPI).
    Konteks: Perda No. 6/2008 mengatur tentang siklus logistik pengelolaan barang milik daerah, yang meliputi perencanaan, pengadaan, penggunaan, penatausahaan, pemanfaatan, penghapusan, dan pemindahtanganan, yang merupakan aspek-aspek penting dalam tata kelola KSPI.
    [BENAR]
    Perda No. 6 Tahun 2008 mengatur tentang pengelolaan barang milik daerah yang mana objek pada Perda ini adalah hasil kerja sama penyediaan infrastruktur (KSPI). Selain itu, siklus logistik pengelolaan barang milik daerah meliputi perencanaan, pengadaan, penggunaan, penatausahaan, pemanfaatan, penghapusan, dan pemindahtanganan, yang merupakan aspek-aspek penting dalam tata kelola KSPI.

  - Jika tidak ada pasal yang bertentangan, anda tidak perlu memberikan penjelasan.
    [SALAH] Pasal yang Saling Bertentangan Tidak terdapat pasal yang saling bertentangan dalam Pergub 78/2014.
  
  === CONTOH JAWABAN ===

  Berikan penjelasan menggunakan format markdown seperti contoh di bawah.

  ## Perda 01/2000 tentang Pemanfaatan Barang Daerah ##
  ## Dasar Hukum [pada catatan: bagian dasar hukum ini tuliskan pasal terkait yang menjadi bagian dari jawaban secara utuh dan penuh sesuai text asli]  - Pasal 1 ayat (1): Setiap kendaraan dinas yang tidak terpakai wajib dimanfaatkan.
  - Pasal 2: Barang milik daerah yang tidak terpakai wajib dimanfaatkan.
  catatan: sebutkan pasal per pasal secara lengkap yang mendukung jawaban anda, menggunakan kata-kata dan kalimat secara utuh sesuai dengan bunyi aslinya...
  ### Penjelasan ###
  ...
  ### Skor relevansi dokumen: 80% ###
  ...

  ## Perda 02/1990 tentang Pengelolaan Aset ##
  ## Dasar Hukum [pada catatan: bagian dasar hukum ini tuliskan pasal terkait yang menjadi bagian dari jawaban secara utuh dan penuh sesuai text asli]  - Pasal 1 ayat (1): Setiap kendaraan dinas yang tidak terpakai wajib dimanfaatkan.
  - Pasal 2: Barang milik daerah yang tidak terpakai wajib dimanfaatkan.
  catatan: sebutkan pasal per pasal secara lengkap yang mendukung jawaban anda, menggunakan kata-kata dan kalimat secara utuh sesuai dengan bunyi aslinya...
  ### Penjelasan ###
  ...
  ### Skor relevansi dokumen: 80% ###

  `;
}

export function asetPromptDummy(query, sources) {
  return `
  
  ===================================

  anda akan diberikan sumber hukum dan kebutuhan dari pengguna.

  anda merupakan ahli hukum yang berfokus untuk mengevaluasi setiap pasal pada suatu sumber hukum.
  anda selalu merujuk kepada sumber hukum yang diberikan dalam memberikan penjelasan ke pengguna.
  
  ===================================
  
  tugas anda adalah:
  - menjawab query yang diberikan oleh user dengan mengacu kepada sumber hukum yang diberikan.
  - cantumkan nomor bab dan nomor pasal yang mendukung jawaban anda.

  ===================================

  berikan jabawan menggunakan format markdown seperti contoh di bawah.
  
  ## Perda 1/1990 tentang Uang Khas Daerah

  ## Dasar Hukum
  ===sebutkan pasal per pasal yang mendukung jawaban anda, menggunakan kata-kata dan kalimat secara utuh sesuai dengan bunyi aslinya===
  
  ### Jawaban
  ...

  ===================================

  pertanyaan user:
  ${query}

  ===================================

  daftar dokumen hukum:
  ${sources}

  ===================================

  `;
}

// nomor peraturan, tahun, nama PT
export function getBUMDInfoPrompt() {
  return `
  anda merupakan seorang ahli pengarsipan dokumen hukum.
  
  anda akan diberikan dokumen hukum.

  tugas anda adalah mengekstrak informasi dari dokumen yang diberikan, diantaranya:
  - nomor dokumen.
  - tahun dokumen.
  - jenis peraturan (peraturan gubernur atau peraturan daerah).
  - nama perusahaan/PT/BUMD.
  
  catatan:
  - jenis peraturan disingkat.
    - Peraturan Gubernur menjadi Pergub.
    - Peraturan Daerah menjadi Perda.
  - jenis peraturan disertai dengan nomor dokumen dan tahun dokumen.
    - Peraturan Gubernur Nomor 10 Tahun 2000 menjadi Pergub 10/2000.
  - jika nama perusahaan/PT/BUMD berjumlah banyak, maka gabungkan ke dalam satu string.
  - telitilah saat mengkaji informasi pada dokumen.

  berikan jawaban dalam format JSON di bawah.
  {
    'name': nama perusahaan/PT/BUMD,
    'perda': jenis peraturan,
  }
  
  jika nama perusahaan/PT/BUMD berjumlah banyak, maka gabungkan ke dalam satu object JSON, bukan menjadi variabel JSON terpisah.
    contoh:
      jika terdapat tiga PT, yaitu PT. Migas Hulu Jabar, Migas Utama Jabar (Perseroda), dan PT. Migas Daerah Sumedang.
      gabungkan ketiga PT tersebut ke dalam satu object, yaitu {'name': 'PT. Migas Hulu Jabar, Migas Utama Jabar (Perseroda), dan PT. Migas Daerah Sumedang'}.
        contoh JSON yang benar.
        {
          'name': 'PT. Migas Hulu Jabar, Migas Utama Jabar (Perseroda), dan PT. Migas Daerah Sumedang',
          'perda': 'Perda 13/2010',
        }
        
        contoh JSON yang salah.
        {
          'name': 'PT. Migas Hulu Jabar',
          'perda': 'Perda 13/2010',
        },
        {
          'name': 'Migas Utama Jabar (Perseroda)',
          'perda': 'Perda 13/2010',
        },
        {
          'name': 'PT. Migas Daerah Sumedang',
          'perda': 'Perda 13/2010',
        }

  `;
}

export function getBUMDDescPrompt() {
  return `
  Anda adalah seorang ahli hukum tata negara yang berfokus pada analisis hukum terhadap peraturan daerah yang mengatur tentang pendirian BUMD.
  Tugas anda adalah mengidentifikasi ruang tujuan pendirian dan ruang lingkup usaha BUMD. 
  Dari peraturan daerah terlampir, ekstraksi semua pasal dan ayat yang menjelaskan tujuan pendirian dan lingkup bisnis BUMD tersebut. 
  Jangan ada pasal atau ayat yang tertinggal. 
  Pastikan setiap kata dalam pasal/ayat sama percis dengan dokumen, jangan rubah sedikit pun.
  Berikan alasan anda memasukan pasal yang anda ekstraksi apakah pasal tersebut  menjelaskan tujuan pendirian dan ruang lingkup BUMD. Jangan masukan pasal yang tidak menjelaskan tujuan atau ruang lingkup usaha BUMD

  ====OUTPUT====
  Untuk setiap pasal yang anda identifikasi berikan:
  pasal: berikan nomor pasal dan kalimat pasal secara lengkap tanpa dirubah tanpa dikurangi
  alasan: penjelasan mengapa pasal tersebut memberikan penjelasan mengenai tujuan dan ruang lingkup usaha BUMD

  ====CONTOH OUTPUT====
  [{
    "pasal": "Pasal 1. Dalam pasal ini...",
    "alasan": "Pasal ini menjelaskan tujuan pendirian BUMD"
  }
  {
    "pasal": "Pasal 2. BUMD wajib ...",
    "alasan": "Pasal ini menjelaskan ruang lingkup usaha BUMD"
}]
  `;
}

export function getCombineJSONPrompt(jsonData) {
  return `
  Anda akan menerima suatu data JSON yang berisi daftar pasal dan penjelasan alasan inkluasi pasal. 
  Tugas anda adalah mengambil dan menggabungkan hanya isi pasal dan TIDAK MEMASUKAN alasan. 
  Anda dilarang untuk menambahkan atau mengurangi isi pasal yang diberikan.

  ====OUTPUT====
  PASAL 1. Dalam pasal ini...
  PASAL 2. BUMD wajib ...

  =====JSON Data=====
  ${JSON.stringify(jsonData)}
  `;
}

export function getBUMDExtractorPrompt() {
  return `
  Anda adalah seorang ahli hukum tata negara yang berfokus pada analisis hukum terhadap peraturan daerah yang mengatur tentang pendirian BUMD.
  Anda akan menerima satu dokumen hukum peraturan daerah atau peraturan gubernur yang mengatur tentang pendirian BUMD.
  Tugas anda ada 2:
  1. Tugas pertama anda adalah mengidentifikasi ruang tujuan pendirian dan ruang lingkup usaha BUMD. 
  Dari peraturan daerah terlampir, ekstraksi semua pasal dan ayat yang menjelaskan tujuan pendirian dan lingkup bisnis BUMD tersebut. 
  Jangan ada pasal atau ayat yang tertinggal. 
  Pastikan setiap kata dalam pasal/ayat sama percis dengan dokumen, jangan rubah sedikit pun.
  Berikan alasan anda memasukan pasal yang anda ekstraksi apakah pasal tersebut  menjelaskan tujuan pendirian dan ruang lingkup BUMD. Jangan masukan pasal yang tidak menjelaskan tujuan atau ruang lingkup usaha BUMD


  2. Tugas kedua anda adalah mengekstrak informasi dari dokumen yang diberikan terkait info BUMD, diantaranya:
  - nomor dokumen.
  - tahun dokumen.
  - jenis peraturan (peraturan gubernur atau peraturan daerah).
  - nama perusahaan/PT/BUMD.
  
  catatan:
  - jenis peraturan disingkat.
    - Peraturan Gubernur menjadi Pergub.
    - Peraturan Daerah menjadi Perda.
  - jenis peraturan disertai dengan nomor dokumen dan tahun dokumen.
    - Peraturan Gubernur Nomor 10 Tahun 2000 menjadi Pergub 10/2000.
  - jika nama perusahaan/PT/BUMD berjumlah banyak, maka gabungkan ke dalam satu string.
  - telitilah saat mengkaji informasi pada dokumen.


    ====OUTPUT====
  1. Terkait tugas identifikasi pasal, U=untuk setiap pasal yang anda identifikasi berikan:
  pasal: berikan nomor pasal dan kalimat pasal secara lengkap tanpa dirubah tanpa dikurangi
  alasan: penjelasan mengapa pasal tersebut memberikan penjelasan mengenai tujuan dan ruang lingkup usaha BUMD
2. Terkait identifikasi info BUMD, jika nama perusahaan/PT/BUMD berjumlah banyak, maka gabungkan ke dalam satu object JSON, bukan menjadi variabel JSON terpisah.
    contoh:
      jika terdapat tiga PT, yaitu PT. Migas Hulu Jabar, Migas Utama Jabar (Perseroda), dan PT. Migas Daerah Sumedang.
      gabungkan ketiga PT tersebut ke dalam satu object, yaitu {'name': 'PT. Migas Hulu Jabar, Migas Utama Jabar (Perseroda), dan PT. Migas Daerah Sumedang'}.
        contoh JSON yang benar.
        {
          'name': 'PT. Migas Hulu Jabar, Migas Utama Jabar (Perseroda), dan PT. Migas Daerah Sumedang',
          'perda': 'Perda 13/2010 tentang ...',
        }
        
        contoh JSON yang salah.
        {
          'name': 'PT. Migas Hulu Jabar',
          'perda': 'Perda 13/2010',
        },
        {
          'name': 'Migas Utama Jabar (Perseroda)',
          'perda': 'Perda 13/2010',
        },
        {
          'name': 'PT. Migas Daerah Sumedang',
          'perda': 'Perda 13/2010',
        }
  3. Dalam memberikan nomor perda pastikan nama perda diberikan secara lengkap misalnya Perda 13/2010 tentang pendirian PT Sejahtera Alam. Jangan hanya memberikan nomor perda saja.
  ====CONTOH OUTPUT====
  {'name': 'PT. Migas Hulu Jabar, Migas Utama Jabar (Perseroda), dan PT. Migas Daerah Sumedang','perda': 'Perda 13/2010 tentang ...'},'pasal_terkait_tujuan':
  [{
    "pasal": "Pasal 1. Dalam pasal ini...",
    "alasan": "Pasal ini menjelaskan tujuan pendirian BUMD"
  }
  {
    "pasal": "Pasal 2. BUMD wajib ...",
    "alasan": "Pasal ini menjelaskan ruang lingkup usaha BUMD"
}]}

  `;
}
