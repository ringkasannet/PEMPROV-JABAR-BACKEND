import express from "express";
import { getAllBUMD, processEmbeddings, processQuery, addPropertyMongoDb, getBUMDCandidate, evaluasiBUMD, getBumdFromId } from "./dataHandler.js";
import { evaluasiBUMDPrompt as evaluasiBUMDPromptOpenAI } from "./openAI.js";
import { evaluasiBUMDPrompt as evaluasiBUMDPromptGemini } from "./geminiAI.js";
export const router = express.Router();

const timeLog = (req, res, next) => {
  console.log("Time:", Date.now());
  next();
};

router.get("/", (req, res) => {
  res.send(`halaman root`);
});

router.get("/getAPiKey", (req, res) => {
  res.send(process.env.OPENAI_API_KEY);
});

router.get("/getAllBUMD", async (req, res) => {
  console.log(`halaman getAllBUMD`);
  const listBUMD = await getAllBUMD();
  res.send(listBUMD);
});

router.get("/processEmbeddings", async (req, res) => {
  console.log(`halaman processEmbeddings`);
  try {
    const embeddedDoc = await processEmbeddings();
    console.log(`got docs: ${embeddedDoc}`);
    res.send(embeddedDoc);
  } catch (error) {
    // res.status(500).send(error);
  }
});

router.get("/askQuestion/:query/:model", async (req, res) => {
  console.log("halaman /askQuestion/:query:", req.params.query, req.params.model);
  try {
    const queryResults = await processQuery(req.params.query, req.params.model); //TODO sanitasi query
    res.send(queryResults);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get("/getBUMDCandidate/:query/:num", async (req, res) => {
  console.log("In /getBUMDCandidate query:", req.params.query, req.params.num);
  try {
    const queryResults = await getBUMDCandidate(req.params.query, Number(req.params.num)); //TODO sanitasi query
    res.send({ bumdCandidate: queryResults });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get("/evaluasiBUMD/:bumdId/:query/:model", async (req, res) => {
  // console.log(req.body)
  // res.send(req.body)n
  try {
    console.debug("in evaluasiBUMD, retrieving data from mongodb for bumd:", req.params.bumdId, " query: ", req.params.query);
    const bumd = await getBumdFromId(req.params.bumdId);
    console.log("got bumd:", bumd[0].name);

    switch (req.params.model) {
      case "OpenAi":
        const streamOpenAi = await evaluasiBUMD(req.params.query, bumd[0]);
        for await (const chunk of streamOpenAi) {
          if (chunk.choices[0].delta.content) {
            res.write(chunk.choices[0].delta.content);
          } else {
          }
        }
        break;
      case "GeminiAi":
        const streamGemini = await evaluasiBUMDPromptGemini(req.params.query, bumd[0]);
        for await (const chunk of streamGemini.stream) {
          const chunkText = chunk.text();
          res.write(chunkText);
        }
        break;
      default:
        break;
    }
    // const streamOpenAi = await evaluasiBUMD(req.params.query, bumd[0]);

    // for await (const chunk of streamOpenAi) {
    //   // console.log(chunk.choices[0].delta.content);
    //   // console.info("chunk.choices[0].delta.content");
    //   if (chunk.choices[0].delta.content) {
    //     res.write(chunk.choices[0].delta.content);
    //     // res.write("halo");
    //   } else {
    //   }
    // }
    // res.end("done");
  } catch (error) {
    console.error("ditemukan error:",error);
    if (req.params.model="GeminiAi") res.status(400).send({message:await error.message});
    else res.status(400).send(error);
  }
});
router.get("/addProperty/:propName/:propValue", (req, res) => {
  addPropertyMongoDb(req.params.propName, req.params.propValue);
  res.status(200).send("ok");
});

router.get("/askDummy", async (req, res) => {
  res.send(outputDummy);
});

const outputDummy = [
  {
    _id: "dummy",
    name: "PT Jasa Sarana Jawa Barat",
    desc: "## BUMD PT Jasa Sarana Jawa Barat\n\n## Tujuan Pendirian dan Ruang Lingkup Usaha:\n\nPT Jasa Sarana Jawa Barat didirikan dengan tujuan utama untuk menyelenggarakan usaha jasa pengelolaan di bidang prasarana infrastruktur pada kawasan khusus, seperti jalan tol dan fasilitas lainnya. BUMD ini bertujuan untuk beroperasi secara profesional dengan prinsip\\-prinsip usaha bisnis sesuai peraturan perundang\\-undangan yang berlaku. Lebih luas lagi, PT Jasa Sarana Jawa Barat bertujuan untuk:\n\n-   Memberikan pelayanan yang optimal kepada masyarakat.\n    \n-   Membantu menggerakkan perekonomian Daerah Jawa Barat.\n    \n-   Memberikan kontribusi terhadap pendapatan Daerah Jawa Barat.\n    \n\nRuang lingkup usaha PT Jasa Sarana Jawa Barat meliputi kegiatan:\n\n-   Perencanaan prasarana infrastruktur pada kawasan khusus.\n    \n-   Pengorganisasian pembangunan prasarana infrastruktur.\n    \n-   Pembangunan prasarana infrastruktur.\n    \n-   Pengoperasian prasarana infrastruktur.\n    \n-   Pemeliharaan prasarana infrastruktur.\n    \n\n## Dasar Hukum:\n\n**Nama Peraturan Daerah:** Peraturan Daerah Propinsi Jawa Barat Nomor 26 Tahun 2001 tentang Pendirian PT Jasa Sarana Jawa Barat.\n\n**Pasal 2:**\n\n> Pembentukan Badan Usaha Milik Daerah dimaksudkan untuk mendirikan Badan Usaha yang berbentuk badan hukum, bergerak dalam bidang yang sesuai dengan kewenangan Daerah, mampu memberikan pelayanan sebaik\\-baiknya kepada masyarakat, membantu menggerakkan perekonomian Daerah dan memberikan kontribusi terhadap pendapatan Daerah.\n\n**Pasal 3:**\n\n> Badan Usaha yang dibentuk sebagaimana dimaksud pada Pasal 2 Peraturan Daerah ini bertujuan menyelenggarakan usaha jasa pengelolaan di bidang prasarana infrastruktur pada kawasan khusus antara lain jalan tol dan fasilitas lainnya, yang mampu menjalankan usahanya secara profesional dengan prinsip\\-prinsip usaha bisnis sesuai dengan peraturan perundang\\-undangan yang berlaku.\n\n**Pasal 6 Ayat (1):**\n\n> Kegiatan usaha PT Jasa Sarana Jawa Barat sebagaimana dimaksud dalam Pasal 2 Peraturan Daerah ini meliputi pengelolaan prasarana infrastruktur pada kawasan khusus dan fasilitas lainnya.\n\n**Pasal 6 Ayat (2):**\n\n> Pengelolaan sebagaimana dimaksud pada Ayat (1) Pasal ini meliputi kegiatan\\-kegiatan perencanaan, pengorganisasian, pembangunan, pengoperasian dan pemeliharaan yang memberikan manfaat bagi kepentingan masyarakat dan pembangunan ekonomi Daerah.\n",
    perda: "Perda 26/2001",
    penjelasan: "A. Skor: 0%\n\nB. ID BUMD: 662650b65f0d70008a1ac6e2\n\nC. Nama BUMD: PT Jasa Sarana Jawa Barat\n\nD. Penjelasan:\n\nPT Jasa Sarana Jawa Barat didirikan dengan tujuan utama menyelenggarakan usaha jasa pengelolaan di bidang prasarana infrastruktur pada kawasan khusus, seperti jalan tol dan fasilitas lainnya (Pasal 3). Sementara itu, pembersihan air bukan merupakan kegiatan yang termasuk dalam ruang lingkup usaha PT Jasa Sarana Jawa Barat (Pasal 6 Ayat 1 dan 2). Oleh karena itu, penugasan pembersihan air tidak sesuai dengan tujuan pendirian perusahaan BUMD ini dan berada di luar inti dasar pekerjaan yang dilakukan perusahaan saat ini.",
  },
  {
    _id: "dummy",
    name: "PT Bandarudara Internasional Jawa Barat (PT BIJB)",
    desc: "## BUMD: PT Bandarudara Internasional Jawa Barat (BIJB)\n\n**Tujuan Pendirian dan Ruang Lingkup Usaha:**\n\nPT BIJB didirikan untuk mengembangkan dan mengelola Bandar Udara Internasional Jawa Barat (BIJB) dan Kertajati Aerocity. Tujuannya adalah untuk meningkatkan perekonomian daerah, memberikan kontribusi terhadap pendapatan asli daerah, dan mendorong pertumbuhan ekonomi melalui pengembangan infrastruktur dan kegiatan terkait bandar udara dan aerocity.\n\n**Dasar Hukum:**\n\n**Nama Peraturan Daerah:** Peraturan Daerah Provinsi Jawa Barat Nomor 23 Tahun 2013 tentang Penyertaan Modal Pemerintah Provinsi Jawa Barat pada PT Bandarudara Internasional Jawa Barat\n\n**Pasal 2**\n\n> Tujuan penyertaan modal Daerah pada PT Bandarudara Internasional Jawa Barat adalah :\n> \n> a. untuk pemenuhan modal disetor Pemerintah Daerah;  \n> b. mengembangkan investasi Daerah;  \n> c. meningkatkan permodalan Perseroan;  \n> d. mendorong pertumbuhan ekonomi Daerah; dan  \n> e. memberikan kontribusi kepada pendapatan asli Daerah.",
    perda: "Perda 23/2013",
    penjelasan:
      "A. Skor: 20%\n\nB. ID BUMD: 66265ade5b5554f1e30199b4\n\nC. Nama BUMD: PT Bandarudara Internasional Jawa Barat (PT BIJB)\n\nD. Penjelasan:\n\nPotensi penugasan pembersihan air tidak menunjukkan kesesuaian yang kuat dengan tujuan pendirian PT BIJB.\n\n* **Tujuan Pendirian:** Tujuan pendirian PT BIJB, sebagaimana disebutkan dalam Pasal 2 Perda Provinsi Jawa Barat Nomor 23 Tahun 2013, adalah untuk mengembangkan dan mengelola bandar udara dan aerocity, bukan untuk menyediakan layanan pembersihan air.\n* **Domain Pekerjaan:** Pembersihan air tidak termasuk dalam domain pekerjaan utama PT BIJB, yang berfokus pada operasi dan pengembangan infrastruktur terkait bandar udara.\n* **Proses Bisnis:** Tidak ada kaitan yang jelas antara pembersihan air dengan proses bisnis utama PT BIJB, yang berkonsentrasi pada manajemen bandara dan kegiatan terkait.\n* **Inti Pekerjaan:** Pembersihan air keluar dari inti dasar pekerjaan yang dilakukan PT BIJB saat ini, yaitu pengelolaan dan pengembangan bandara dan aerocity. Oleh karena itu, kesesuaian potensi penugasan pembersihan air dengan tujuan pendirian PT BIJB sangat terbatas.",
  },
  {
    _id: "6626ad5f820c1b2afecf8c55",
    name: "PT Tirta Gemah Ripah",
    desc: "## BUMD PT Tirta Gemah Ripah\n\n**Tujuan Pendirian dan Ruang Lingkup Usaha:**\n\nBUMD ini didirikan dengan tujuan untuk mengembangkan investasi daerah, meningkatkan permodalan PT Tirta Gemah Ripah, mendorong pertumbuhan ekonomi daerah, dan meningkatkan pendapatan asli daerah. Ruang lingkup usahanya adalah pengembangan, pengusahaan, dan pemanfaatan prasarana sumber daya air untuk kesejahteraan rakyat. PT Tirta Gemah Ripah diharapkan dapat memberikan pelayanan terbaik kepada masyarakat, menggerakkan perekonomian daerah, dan memberikan kontribusi terhadap pendapatan daerah.\n\n**Dasar Hukum:**\n\nNama Peraturan Daerah: PERATURAN DAERAH PROVINSI JAWA BARAT NOMOR 21 TAHUN 2010 TENTANG PENYERTAAN MODAL PEMERINTAH PROVINSI JAWA BARAT PADA PT TIRTA GEMAH RIPAH\n\n**Pasal 3**\n\n> Tujuan penyertaan modal Pemerintah Daerah pada PT Tirta Gemah Ripah adalah :\n> \n> a. mengembangkan investasi Daerah;\n> \n> b. meningkatkan permodalan PT Tirta Gemah Ripah;\n> \n> c. mendorong pertumbuhan ekonomi Daerah; dan\n> \n> d. meningkatkan pendapatan asli Daerah.\n\n**Pasal 4**\n\n> (1) Kewajiban penyertaan modal Daerah pada PT Tirta Gemah Ripah adalah sebesar 51% (lima puluh satu persen) dari Rp. 60.000.000.000,00 (enam puluh miliar rupiah) yang terbagi atas 600.000 (enam ratus ribu) lembar saham dengan nilai nominal Rp. 100.000,00 (seratus ribu rupiah) per lembar saham atau sebesar Rp. 30.600.000.000,00 (tiga puluh miliar enam ratus juta rupiah) yang terbagi atas 306.000 (tiga ratus enam ribu) lembar saham.\n> \n> (2) Penyertaan modal Daerah pada PT Tirta Gemah Ripah sampai dengan tanggal 31 Desember 2007 telah disetor sebesar Rp. 3.300.000.000,00 (tiga miliar tiga ratus juta rupiah) yang terbagi atas 33.000 (tiga puluh tiga ribu) lembar saham dengan masing\\-masing saham bernilai nominal Rp. 100.000,00 (seratus ribu rupiah), sehingga terdapat sisa kewajiban penambahan modal disetor sebesar Rp. 27.300.000.000,00 (dua puluh tujuh miliar tiga ratus juta rupiah).\n> \n> (3) Untuk memenuhi sisa penambahan modal disetor Pemerintah Daerah sebagaimana dimaksud pada ayat (2), dianggarkan penyertaan modal Daerah dalam APBD Perubahan Tahun Anggaran 2010 pada bagian pengeluaran pembiayaan sebesar Rp. 6.120.000.000,00 (enam miliar seratus dua puluh juta rupiah) yang terbagi atas 61.200 (enam puluh satu ribu dua ratus) lembar saham dengan nilai nominal Rp. 100.000,00 (seratus ribu rupiah).\n> \n> (4) Dalam hal penyertaan modal Daerah sebagaimana dimaksud pada ayat (3) telah dipenuhi, maka sisa kewajiban penambahan modal disetor kepada PT Tirta Gemah Ripah adalah sebesar Rp. 21.180.000.000,\\- (dua puluh satu miliar seratus delapan puluh juta rupiah).\n> \n> (5) Sisa kewajiban penambahan modal disetor Pemerintah Daerah sebagaimana dimaksud pada ayat (4), akan dipenuhi melalui penyertaan modal Daerah secara bertahap sesuai dengan kebutuhan PT Tirta Gemah Ripah dan berdasarkan kemampuan keuangan Daerah, yang jumlah besarannya dianggarkan dalam Peraturan Daerah tentang APBD.\n",
    perda: "Perda 21/2010",
    penjelasan:
      "**A. Skor: 100%**\n\n**B. ID BUMD: 6626ad5f820c1b2afecf8c55**\n\n**C. Nama BUMD: PT Tirta Gemah Ripah**\n\n**D. Penjelasan:**\n\nPotensi penugasan pembersihan air dinilai sangat sesuai dengan tujuan pendirian PT Tirta Gemah Ripah sebagaimana diatur dalam **Pasal 3** Peraturan Daerah Provinsi Jawa Barat Nomor 21 Tahun 2010.\n\n1. **Kesesuaian dengan Tujuan Pendirian BUMD:**\nPembersihan air merupakan bagian penting dari pengembangan dan pengusahaan prasarana sumber daya air, yang menjadi ruang lingkup usaha utama PT Tirta Gemah Ripah. Dengan menyediakan layanan pembersihan air, BUMD ini dapat memenuhi kebutuhan masyarakat, meningkatkan kesejahteraan rakyat, dan berkontribusi pada pertumbuhan ekonomi daerah, sesuai dengan tujuan pendiriannya.\n\n2. **Domain Pekerjaan yang Terkait:**\nPembersihan air erat kaitannya dengan pengelolaan sumber daya air, yang merupakan domain pekerjaan utama PT Tirta Gemah Ripah. Penugasan ini mendukung operasional perusahaan dalam menyediakan layanan air bersih dan berkualitas tinggi kepada masyarakat.\n\n3. **Proses Bisnis Perusahaan:**\nPembersihan air dapat diintegrasikan dengan proses bisnis PT Tirta Gemah Ripah yang sudah ada, seperti pengolahan dan distribusi air. Penugasan ini tidak memerlukan perubahan atau penambahan signifikan pada proses bisnis perusahaan.\n\n4. **Keterkaitan dengan Inti Pekerjaan:**\nPembersihan air tidak keluar jauh dari inti pekerjaan PT Tirta Gemah Ripah, yaitu pengelolaan sumber daya air. Penugasan ini justru memperkuat kompetensi dan kapasitas perusahaan dalam bidang tersebut.\n\nOleh karena itu, potensi penugasan pembersihan air dinilai sangat sesuai dengan tujuan pendirian, domain pekerjaan, proses bisnis, dan inti pekerjaan PT Tirta Gemah Ripah.",
  },
  {
    _id: "6626aee2820c1b2afecf8c5a",
    name: "Bidang Minyak dan Gas Bumi Lingkup Kegiatan Usaha Hulu (Perseroan Terbatas)",
    desc: "## BUMD Bidang Minyak dan Gas Bumi Lingkup Kegiatan Usaha Hulu (Perseroan Terbatas)\n\n**Tujuan Pendirian dan Ruang Lingkup Usaha:**\n\nBUMD ini dibentuk untuk mengelola dan memanfaatkan potensi sumber daya alam minyak dan gas bumi di Provinsi Jawa Barat melalui kegiatan usaha hulu, meliputi eksplorasi dan eksploitasi. Tujuannya adalah:\n\n-   Memanfaatkan dan mengoptimalkan potensi sumber daya alam minyak dan gas bumi secara berkelanjutan dan berwawasan lingkungan.\n    \n-   Mengembangkan investasi daerah.\n    \n-   Memberikan kontribusi terhadap Pendapatan Asli Daerah.\n    \n-   Menggerakkan perekonomian daerah.\n    \n\n**Dasar Hukum:**\n\nNama Peraturan Daerah: **Peraturan Daerah Provinsi Jawa Barat Nomor 14 Tahun 2013 tentang Pembentukan Badan Usaha Milik Daerah Bidang Minyak dan Gas Bumi Lingkup Kegiatan Usaha Hulu**\n\n**Pasal\\-pasal terkait:**\n\n**Pasal 2**\n\n> Maksud pembentukan BUMD bidang minyak dan gas bumi lingkup kegiatan usaha hulu adalah untuk mengusahakan potensi sumberdaya alam minyak dan gas bumi di Daerah dan mengoptimalkan peluang pengusahaan pada kegiatan usaha hulu minyak dan gas bumi.\n\n**Pasal 3**\n\n> Tujuan pembentukan BUMD bidang minyak dan gas bumi lingkup kegiatan usaha hulu adalah :\n> \n> a. memanfaatkan dan mengoptimalkan potensi sumberdaya alam minyak dan gas bumi yang dikelola secara berkelanjutan dan berwawasan lingkungan;\n> \n> b. mengembangkan investasi Daerah;\n> \n> c. memberikan kontribusi terhadap Pendapatan Asli Daerah; dan\n> \n> d. menggerakkan perekonomian Daerah.\n\n**Pasal 9**\n\n> (1) Bidang kegiatan usaha Perseroan adalah kegiatan usaha hulu minyak dan gas bumi mencakup :\n> \n> a. eksplorasi; dan\n> \n> b. eksploitasi.\n> \n> (2) Perseroan dapat mendirikan Anak Perusahaan untuk pengembangan kegiatan usaha sebagaimana dimaksud pada ayat (1), sesuai ketentuan peraturan perundang\\-undangan.\n> \n> (3) Pendirian Anak Perusahaan sebagaimana dimaksud pada ayat (2) diusulkan oleh Direksi Perseroan dan selanjutnya ditelaah oleh Dewan Komisaris, sebagai bahan saran dan pertimbangan yang diajukan dalam RUPS untuk mendapat persetujuan.\n> \n> (4) Dalam hal RUPS menyetujui pendirian Anak Perusahaan sebagaimana dimaksud pada ayat (2) dan ayat (3), maka Direksi Perseroan memproses pendirian Anak Perusahaan, sesuai ketentuan peraturan perundang\\-undangan.\n",
    perda: "Perda 14/2013",
    penjelasan: "A. Skor: 0%\n\nB. ID BUMD: 6626aee2820c1b2afecf8c5a\n\nC. Nama BUMD: Bidang Minyak dan Gas Bumi Lingkup Kegiatan Usaha Hulu (Perseroan Terbatas)\n\nD. Penjelasan:\n\nPotensi penugasan pembersihan air tidak sesuai dengan tujuan pendirian BUMD yang berfokus pada pengelolaan dan pemanfaatan sumber daya alam minyak dan gas bumi melalui kegiatan usaha hulu, meliputi eksplorasi dan eksploitasi (Pasal 2 dan 9). Bidang pekerjaan pembersihan air berada di luar ruang lingkup kegiatan usaha yang ditetapkan, dan tidak terkait dengan proses bisnis inti perusahaan. Selain itu, penugasan tersebut tidak memberikan kontribusi terhadap tujuan atau peran BUMD dalam pengembangan investasi daerah, kontribusi terhadap Pendapatan Asli Daerah, atau penggerakkan perekonomian daerah (Pasal 3). Oleh karena itu, penugasan pembersihan air tidak sesuai dengan tujuan pendirian BUMD dan tidak dapat dilaksanakan.",
  },
  {
    _id: "6626addd820c1b2afecf8c56",
    name: "PT Agro Jabar",
    desc: '## BUMD PT Agro Jabar\n\n**Tujuan Pendirian dan Ruang Lingkup Usaha:**\n\nBUMD ini dibentuk dengan tujuan untuk mengoptimalkan pengelolaan aset daerah secara efektif, efisien, dan akuntabel. Hal ini bertujuan untuk meningkatkan daya guna aset daerah, mengembangkan investasi daerah, memberikan kontribusi pada Pendapatan Asli Daerah, serta membantu menggerakkan perekonomian daerah dan pelayanan kepada masyarakat.\n\nInformasi mengenai ruang lingkup usaha secara spesifik tidak tersedia dalam dokumen ini. Namun, mengingat namanya "PT Agro Jabar", dapat diasumsikan bahwa BUMD ini bergerak di bidang agrobisnis.\n\n**Dasar Hukum:**\n\nNama Peraturan Daerah: Peraturan Daerah Provinsi Jawa Barat Nomor 18 Tahun 2012 tentang Penyertaan Modal Pemerintah Provinsi Jawa Barat Pada PT Agro Jabar\n\n**Pasal\\-pasal terkait:**\n\n-   **Pasal 2**\n    \n\n> Maksud penyertaan modal Daerah adalah untuk pemenuhan modal disetor pada PT Agro Jabar.\n\n-   **Pasal 3**\n    \n\n> Tujuan penyertaan modal Daerah pada PT Agro Jabar adalah :\n> \n> a. mengembangkan investasi Daerah;\n> \n> b. meningkatkan permodalan PT Agro Jabar;\n> \n> c. mendorong pertumbuhan ekonomi Daerah; dan\n> \n> d. memberikan kontribusi terhadap pendapatan asli Daerah.\n',
    perda: "Perda 18/2012",
    penjelasan: "A. Skor: 20%\n\nB. ID BUMD: 6626addd820c1b2afecf8c56\n\nC. Nama BUMD: PT Agro Jabar\n\nD. Penjelasan:\n\nPenugasan pembersihan air memiliki keterkaitan yang rendah dengan tujuan pendirian BUMD PT Agro Jabar. Tujuan utama BUMD ini adalah untuk mengoptimalkan pengelolaan aset daerah, mengembangkan investasi daerah, dan memberikan kontribusi pada Pendapatan Asli Daerah. Meskipun pembersihan air dapat dianggap sebagai layanan kepada masyarakat, namun kegiatan tersebut tidak termasuk dalam ruang lingkup usaha BUMD yang bergerak di bidang agrobisnis.\n\nSelain itu, pembersihan air memerlukan domain pekerjaan yang berbeda dengan agrobisnis. Agrobisnis berfokus pada produksi dan pemasaran produk pertanian, sedangkan pembersihan air adalah kegiatan pengelolaan lingkungan. Proses bisnis BUMD juga tidak mencakup kegiatan pembersihan air, sehingga penugasan ini akan keluar terlalu jauh dari inti dasar pekerjaan yang dilakukan perusahaan saat ini.",
  },
];
