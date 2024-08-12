import express from "express";
import { getAllBUMD, processEmbeddings, processQuery, addPropertyMongoDb, getBUMDCandidate, evaluasiBUMD, getBumdFromId, inputDataBUMDObject, removeSelectedBUMD } from "./dataHandler.js";
import { uploadAsetChunksToMongo, removePerdaChunks, getAllAset, processAsetEmbeddings, getAsetCandidate, processAsetQuery, inputDataAsetObject, removeSelectedAsetChunks } from "./asetHandler.js";
import { evaluasiBUMDPrompt as evaluasiBUMDPromptOpenAI } from "./openAI.js";
import { evaluasiBUMDPrompt as evaluasiBUMDPromptGemini } from "./geminiAI.js";
import { getAllBUMDVector, getAllAsetVector } from "./pinecone.js";

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
  console.log("halaman /askQuestion/:query:", req.body.query, req.params.model);
  try {
    const queryResults = await processQuery(req.body.query, req.params.model); //TODO sanitasi query
    res.send(queryResults);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getBUMDCandidate/:num", async (req, res) => {
  console.log("In /getBUMDCandidate query:", req.body.query, req.params.num);
  try {
    const queryResults = await getBUMDCandidate(req.body.query, Number(req.params.num)); //TODO sanitasi query
    res.send({ bumdCandidate: queryResults });
  } catch (error) { 
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/evaluasiBUMD/:bumdId/:model", async (req, res) => {
  // console.log(req.body)
  // res.send(req.body)
  try {
    console.debug("in evaluasiBUMD, retrieving data from mongodb for bumd:", req.params.bumdId, " query: ", req.body.query);
    const bumd = await getBumdFromId(req.params.bumdId);
    console.log("got bumd:", bumd[0].name);

    switch (req.params.model) {
      case "OpenAi":
        const streamOpenAi = await evaluasiBUMD(req.body.query, bumd[0]);
        for await (const chunk of streamOpenAi) {
          if (chunk.choices[0].delta.content) {
            res.write(chunk.choices[0].delta.content);
          } else {
          }
        }
        break;
      case "GeminiAi":
        const streamGemini = await evaluasiBUMDPromptGemini(req.body.query, bumd[0]);
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
    console.error("ditemukan error:", error);
    if ((req.params.model = "GeminiAi")) res.status(400).send({ message: await error.message });
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

const chunksData = [
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "1",
    nama_bab: "KETENTUAN UMUM",
    desc: "Pasal 1\n\nDalam Peraturan Daerah ini, yang dimaksud dengan :\n\n1. Pemerintah adalah Perangkat Negara Kesatuan Republik Indonesia yang terdiri dad Presiden berserta para Menteri;\n\n2. Daerah adalah Propinsi Jawa Barat;\n\n3. Pemerintah Daerah adalah Pemerintah Propinsi Jawa Barat yaitu Gubemur beserta perangkat Daerah Otonom yang lain sebagal badan eksekutif Daerah;\n\n4. Gubemur adalah Gubernur Jawa Barat;\n\n5. Dewan Perwakilan Rakyat Daerah yang selanjutnya disebut DPRD adalah Dewan-Perwakilan-Rakyat Daerah Propinsi Jawa Barat;\n\n6. Sekretariat Daerah adalah Sekretariat Daerah Propinsi Jawa Barat;\n\n7. Sekretaris Daerah adalah Sekretaris Daerah Propinsi Jawa Barat;\n\n8. Badan Pengawasan Daerah adalah Badan Pengawasan Daerah Propinsi Jawa Barat;\n\n9. Biro Perlengkapan adalah Biro Perlengkapan pada Sekretariat Daerah Propinsi Jawa Barat;\n\n10. Biro Keuangan adalah Biro Keuangan pada Sekretariat Daerah Propinsi Jawa Barat;\n\n11. Unit Kerja adaiah suatu Perangkat Pemerintah Daerah yang mempunyai pos anggaran tersendiri pada APBD antara lain :\n\na. Sekretariat Daerah; b. Sekretariat DPRD; c. Dinas-Dinas Daerah; d. Lembaga Teknis Daerah;  e.  Unit Pelaksana Teknis Daerah.\n\n12. Pejabat yang berwenang adaiah Pejabat Pemerintah dan/atau Pejabat Pemerintah Daerah yang berwenang membina dan mengawasi penyelenggaraan Pemerintahan Daerah;\n\n13. Otorisator Barang adaiah pejabat yang mempunyai kewenangan untuk mengambil tindakan yang mengakibatkan adanya penerimaan dan pengeluaran barang Daerah;\n\n14. Ordonatur Barang adalah Pejabat yang berwenang untuk\n\nmengendalikan dan bertanggung jawab dalam pelaksanaan pengelolaan Barang Daerah;\n\n15. Bendaharawan Barang adaiah Bendaharawan Umum Barang pada\n\natau Bendaharawan Khusus Barang pada Unit/Satuan kerja;\n\n16. Pengurus Barang adaiah Pejabat yang diserahi tugas untuk mengurus barang Daerah yang berada di luar kewenangan Bendaharawan Barang;\n\n17. Satuan Kerja adalah Bagian dari Unit Kerja;\n\n18. Barang Daerah adalah semua kekayaan atau Met Daerah balk yang dimiliki maupun dikuasai, baik yang bergerak maupun yang tidak bergerak beserta-baglan-bagiannya ataupun yang merupakarr satuarrtertentu yang dapat dinilal, dihitung, diukur atau ditimbang termasuk hewan dan\n\ntumbuh-tumbuhan kecuaii uang dan surat-surat berharga lainnya;\n\n19. Pengelolaan Barang Daerah adalah rangkaian kegiatan dan tindakan terhadap barang Daerah yang meliputi perencanaan, penentuan kebutuhan, penganggaran, standarisasi barang dan harga, pengadaan,\n\n20. Perencanaan adalah kegiatan atau tindakan untuk menghubungkan kegiatan yang telah lalu dengan keadaan yang sedang berjalan sebagal dasar dalam melakukan tindakan yang akan datang;\n\n21. Penentuan Kebutuhan Barang Daerah adalah kegiatan atau tindakan untuk merumuskan rincian kebutuhan pada perencanaan sebagai pedoman dalam melaksanakan pemenuhan kebutuhan barang Daerah yang dituangkan dalam perkiraan anggaran;\n\n22. Pengadaan adalah kegiatan untuk melakukan pemenuhan kebutuhan barang daerah dan jasa;\n\n23. Penyimpanan adalah kegiatan untuk melakukan pengurusan, penyelenggaraan dan pengaturan barang persediaan di dalam gudang/ruang penyimpanan;\n\n24. Penyaluran adalah kegiatan untuk menyalurkan barang dari gudang induk/gudang Unit ke Unit/Satuan Kerja pemakai;\n\n25. Pemeliharaan adalah kegiatan atau tindakan yang dilakukan agar semua barang Daerah selalu dalam keadaan balk dan slap untuk digunakan secara berdaya guna dan berhasil guna;\n\n26. Inventarisasi adalah kegiatan atau tindakan untuk melakukan pengurusan, penyelenggaraan, pengaturan, pencatatan data dan pelaporan barang dalam pemakaian;\n\n27. Perubahan Status Hukum adalah setiap perbuatan/tindakan hukum dad Pemerintah Daerah yang mengakibatkan terjadinya perubahan status pemillkan/penguasaan atas barang Daerah;\n\n28. Penghapusan adalah kegiatan atau tindakan untuk melepaskan pemilikan atau penguasaan barang Daerah dengan menghapus\n\npencatatannya dan Daftar Inventaris Barang Daerah;\n\n29. Standarisasi Barang Daerah adalah pembakuan barang menurut jenis dan spesifikasi seta kualitasnya;\n\n30. Standarisasi Harga merupakan patokan harga satuan barang sesual jenis, spesifikasi dan kualitas barang dalam satu periode tertentu;\n\n31. Standarisasi Kebutuhan Barang Daerah adalah pembakuan jenis, spesifikasi dan kualitas barang daerah menurut strata pegawal dan organisasi;\n\n32. Tukar Menukar Barang Daerah adalah pengalihan pemilikan dan atau penguasaan barang tidak bergerak milik Daerah kepada pihak lain dengan menerima penggantian dalam bentuk barang tidak bergerak dan menguntungkan Daerah;",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "2",
    nama_bab: "TUGAS DAN FUNGSI",
    desc: "Pasal 2\n\nPengelolaan barang_ Daerah dilaksanakan secara terpisah dari pengelolaan barang Pemerintah.\n\nPasal 3\n\n(1) Gubernur sebagai Otorisator dan Ordonator Barang Daerah berwenang dan bertanggung jawab atas pembinaan dan pelaksanaan pengelolaan barang Daerah.\n\n(2) Gubemur dalam rangka pelaksanaan pengelolaan barang Daerah sesuai dengan fungsinya dibantu oleh :\n\na. Sekretaris Daerah;\n\nb. Kepala Biro Perlengkapan; c. Kepala Unit Kerja ; d. Bendaharawan Barang;  e. Pengurus Barang.\n\n(3) Sekretaris Daerah sebagal pembantu Kuasa/Otorisator dan Ordonator barang Daerah, bertanggung jawab atas terselenggaranya koordinasi dan sinkronisasi antar para Pejabat tersebut sebagaimana dimaksud pada Ayat (2) pasal ini.\n\n(4) Kepala Biro Perlengkapan karena jabatannya sebagai Pembantu Kuasa Barang (PKB) menjalankan fungsi Ordonator barang Daerah dalam penyelenggaraan pengelolaan barang Daerah dan mengkoordinir penyelenggaraan barang Daerah pada Unit-unit.\n\n(5) Kepala Unit/Satuan Kerja karena jabatannya sebagal penyelenggara Pernbantu Kuasa Barang (PPKB), berwenang dan bertanggung jawab  atas pengelolaan barang Daerah di lingkungan Unit/Satuan Kerja masing-masing.\n\n(6) Bendaharawan Barang bertugas menerima, menyimpan. dan mengeluarkan barang Daerah yang ada dalam pengurusannya atas perintah pembantu kuasa/ordonator barang Daerah atau pejabat yang ditunjuk oiehnya dan membuat surat pertanggungjawaban kepada Gubernur.\n\n(7)  Pengurus Barang bertugas mengurus barang Daerah yang berada di luar kewenangan Bendaharawan Barang.\n\nPasal 4\n\nSesuai tugas pokok dan fungsinya Kepala Biro Perlengkapan duduk sebagai anggota Panitia Penyusunan Rancangan Anggaran Pendapatan dan Belanja Daerah.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "3",
    nama_bab: "PERENCANAAN DAN PENGADAAN",
    desc: "Bagian Pertama\n\nPerencanaan, Penentuan Kebutuhan dan Penganggaran\n\nPasal 5\n\n(1) Kepala Biro Perlengkapan menyusun :\n\na. Standarisasi barang;  b. standarisasi kebutuhan barang;  c.  standarisasi harga. -\n\n(2)  Perumusan rencana kebutuhan barang Daerah untuk setiap unit balk yang diblayal dad Anggaran Rutin maupun Pembangunan dipergunakan sebagai dasar dan pedoman dalam melakukan suatu tindakan di bldang kebutuhan barang.\n\n(3)   Dalam meiaksanakan belanja barang daerah ditetapkan standarisasi oleh Gubernur.\n\n(4) Perencanaan kebutuhan dan pemeliharaan barang daerah ditentukan dan dlanggarkan dalam Anggaran Belanja Rutin dan Pembangunan.\n\n(5) Tata cara perencanaan kebutuhan dan pemeliharaan barang daerah diatur leblh lanjut dengan Keputusan Gubernur.\n\nBagian Kedua\n\nPengadaan\n\nPasal 6\n\n(1) Pelaksanaan pengadaan barang Daerah dan jasa untuk Anggaran Belanja Rutin dan Belanja Pembangunan dilakukan oleh Panitnigacaty\n\nPekerjaan Daerah (P3D) yang dibentuk dengan Keputusan Gubernur.\n\n(2) Gubernur dapat menetapkan Kebijakan tentang pengadaan/pekerjaan\n\nunit melalui panitia pengadaan/pekerjaan unit (P3U) pada Unit Karja dan untuk Anggaran Pembangunan oleh Pemimpin Proyek;\n\n(3) Panitia pengadaan/pekerjaan tersebut pada Ayat (1) dan Ayat (2 ) bertugas menyelenggarakan proses pengadaan dan mengusuikan calon pemenang kepada Gubernur / Kepala Unit Kerja / Pemimpin Proyek sesual dengan Peraturan perundang-undangan yang berlaku.\n\nPasal 7\n\n(1) Kepala Unit Kerja bertanggungjawab untuk membuat daftar hash pengadaan barang dalam lingkungan wewenangnya dan wajib melaporkan/menyampaikan daftar hasi l  pengadaan barang tersebut kepada Gubernur dalam hal ini kepala Biro Perlengkapan setiap triwulan;\n\n#    (2)  Kepala Biro Perlengkapan bertanggungjawab untuk membuat daftar hasil\n\npengadaan barang daerah yang merupakan kompilasi realisasi pengadaan dalam satu tahun anggaran sebagaimana dimaksud dalam bersangkutan.\n\nPasal. 8\n\n(1) Penerimaan barang yang berasal dad Pihak ketiga berupa hibah, bantuan\n\ndan sumbangan kepada Pemerintah Daerah diserahkan kepada Gubernur dalam hal ini Kepala Biro Perlengkapan dan harus dituangkan dalam Berita Acara Serah Tarima.\n\n(2) Penerimaan barang yang merupakan kewajiban Pihak Ketiga kepada Pemerintah Daerah berdasarkan perjanjlan dan peiaksanaan dad suatu perizinan wajib diserahkan kepada Gubemur dalam hal lni Kepala Biro Perlengkapan disertai dokumen lengkap yang dituangkan dalam Berta Acara Serah Terima.\n\n(3) Kepala Biro Perlengkapan melaksanakan penagihan terhadap kewajiban\n\nPihak Ketiga sebagaimana dimaksud Ayat (2) pasal inl.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "4",
    nama_bab: "PENYIMPANAN DAN PENYALURAN",
    desc: "Pasal. 9\n\n(1) Semua hasil pengadaan barang Daerah yang bergerak diterima oleh Bendaharawan Barang, atau pejabat/pegawai yang ditunjuk oleh Kepala Unit/satuan Kerja.\n\n(2) Bendaharawan Barang atau pejabat yang ditunjuk melakukan tugas-tugas Bendaharawan Barang berkewajiban untuk melaksanakan administrasi perbendaharaan Barang Daerah.\n\n(3) Kepala Unit selaku atasan langsung Bendaharawan Barang, bertanggung jawab atas terlaksananya tertib administrasi barang sebagaimana dimaksud dalam Ayat (2) pasal ini.\n\n(4) Penerlmaan Barang Daerah sebagaimana dimaksud Ayat (1) pasal selanjutnya disimpan dalam gudang / tempat penyimpanan lain.\n\nPasal 10\n\nPenerimaan Barang yang tidak bergerak dilakukan oleh Kepala Unit atau Pejabat yang ditunjuk, kemudian melaporkan kepada Gubemur rnelalul Biro Perlengkapan.\n\nPasal 11\n\n(1) Penerimaan Barang Daerah sebagaimana dimaksud Ayat (1) pasal 9 dilakukan setelah diperiksa oleh Panitia Pemeriksa Barang Daerah (PPBD), sedangkan penerinnaan barang sebagaimana dimaksud Pasal 10 dilakukan setelah diperiksa Instansi Teknis yang berwenang, dengan membuat Berita Acara Pemeriksaan ;\n\n(2) Panitia sebagaimana dimaksud ayat (1) Pasal inl ditetapkan dengan Keputusan Gubernur.\n\nPasal 12\n\nPengeluaran barang oleh Bendaharawan barang dilalcsanakan atas dasar Surat Perintah Pengeluaran Barang ( SPPB ) dad Pejabat yang ditunjuk oleh Gubernur dan untuk barang-barang inventaris disertai dengan Berita Acara Sera h Terima.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "5",
    nama_bab: "PEMELIHARAAN",
    desc: "Pasal 13\n\nKepala Biro Perlengkapan mengkoordinasikan dan bertanggung jawab atas pemeliharaan barang Daerah.\n\nPasal 14\n\n(1) Pelaksanaan pemeliharaan barang Daerah sebagaimana dimaksud Pasal 13 dilakukan oleh Kepala Biro Perlengkapan / Kepala Unit Kerja ;\n\n(2) Pelaksanaan pemeliharaan barang sebagaimana dimaksud Ayat (1) pasal Ini berpedoman pada Daftar Kebutuhan Pemeliharaan Barang Unit (DKPBU).\n\nPasal 15\n\n(1) Kepala Unit Kerja bertanggung jawab untuk membuat daftar hasil pemeliharaan barang dalam lingkungan wewenangnya dan wajib melaporkan /menyampaikan daftar hasil pemeliharaan barang tersebut\n\n1capacla-Gubernur dalam hal Ini Kepala-B1ro Perlengkapan-setlap-tdwulan.\n\n(2) Kepala Biro Perlengkapan meneliti laporan dan menyusun Daftar Hasil Pemeliharaan barang yang dilakukan dalam 1 ( satu ) Tahun Anggaran sebagal lampiran Perhitungan Anggaran Tahun yang bersangkutan.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "6",
    nama_bab: "INVENTARISASI",
    desc: "Pasal 16\n\nBiro Perlengkapan sebagai Pusat Inventarisasi barang bertanggung jawab untuk menghimpun hasil inventarisasi Barang dan menyimpan dokumen kepemilikan.\n\n(2) Kepala Unit/Satuan Kerja bertanggung jawab untuk menginventarisasi seluruh barang inventaris yang ada dilingkungan tanggung jawabnya.\n\n(3) Daftar rekapitulasi inventaris sebagaimana dimaksud Ayat (1) pasal ini\n\ndisampaikan kepada Biro Perlengkapan secara periodik. J.\n\nPasal 17\n\n(1) Pemerintah Daerah diwajlbkan melaksanakan Sensus Barang Daerah sekali dalam 5 (lima) tahun, untuk mendapatkan Buku Inventaris  dan Buku Induk Inventaris beserta rekapitulasi barang.\n\n(2) Biro Perlengkapan sebagai Pusat Inventarisasi Barang bertanggung jawab atas pelaksanaan sensus Barang.\n\n(3) Pelaksanaan sensus Barang Daerah berpedoman pada ketentuan yang\n\nditetapkan oleh Gubernur.\n\nPasal 18\n\nKepala Biro Perlengkapan bertanggung jawab untuk menyusun dan menghimpun seluruh Laporan Mutasi Barang secara periodik dan Daftar Mutasi Barang setiap tahun dart semua Unit/Satuan Kerja Pemerintah Daerah sesual dengan kepemilikannya.\n\nPasal 19\n\n(1) Setiap hasil keglatan/proyek pembangunan baik yang- dibiayai- dari APBD-\n\nmaupun dana lainnya yang merupakan milik Daerah harus diserahkan kepada Gubemur dalam hal ini Kepala Biro Perlengkapan berikut dokumen kepemllikan dengan Berita Acara untuk penyelesaikan inventarisasinya.\n\n(2) Berdasarkan Berita Acara sebagaimana dimaksud Ayat (1) pasal Ini, Gubernur dalam hal ini Kepala Biro Perlengkapan menetapkan pemanfaatannya.\n\n(3) Kepala Unit yang secara struktural  membawa hi Proyek bertanggungjawab sepenuhnya atas pelaksanaan ketentuan Ayat (2).",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "7",
    nama_bab: "PERUBAHAN STATUS HUKUM",
    desc: "Bagian Pertama\n\nPenghapusan\n\nPasal 20\n\n(1) Setiap Barang Daerah yang sudah rusak dan tidak dapat dipergunakan lagl/hilang/mati, tidak efisien dan tidak akan merugikan negara bagi keperluan dinas atau menurut peraturan perundang-undangan yang beriaku, dapat dihapus dan Daftar Inventaris.\n\n(2) Setiap penghapusan Barang Pemerintah Daerah sebagaimana dimaksud Ayat (1), dilaksanakan dengan ketentuan sebagai berikut :\n\na. Barang bergerak seperti Kendaraan Perorangan Dinas, Kendaraan Operasional Dinas ditetapkan dengan Keputusan Gubemur setelah memperoleh persetujuan DPRD, kecuali untuk barang-barang inventaris lainnya cukup dengan Keputusan Gubernur;\n\nb. Barang-barang tidak bergerak ditetapkan dengan Keputusan Gubemur setelah memperoleh ifersetujuan DPRD;\n\nc. Untuk Bangunan dan Gedung yang akan dibangun kembali sesual peruntukan semula seperti rehab total yang sifatnya mendesak atau membahayakan penghapusannya ditetapkan dengan Keputusan Gubernur.\n\n(3) Barang Daerah yang dihapitskan sebagaimana dimaksud Ayat—(1). dan (2), diselesalkan melalui :\n\na. penjualan/pelelangan; b. ruislag/tukar-menukar c. sumbangan/hibah kepada pihak lain; d. pemusnahan.\n\n(4) Hasil Pelelangan/Penjualan harus disetorkan sepenuhnya kepada Kas Daerah.\n\n(5) Penghapusan barang daerah sebagaimana dimaksud Ayat (1) pasal dilaksanakan melalui Panitia Penghapusan Barang Daerah yang ditetapkan dengan Keputusan Gubernur.\n\nBagian Kedua\n\nPenjualan Kendaraan Dinas\n\nPasal 21\n\nKendaraan Dinas yang dapat dijual terdiri dari kendaraan perorangan dinas dan kendaraan operasional\n\nPasal 22\n\n(1) Kendaraan perorangan dinas yang digunakan oleh pejabat Pemerintah Daerah yang berumur 5 (lima) tahun atau leblh dapat dijual 1 (satu) buah kepada pejabat yang bersangkutan setelah masa jabatannya berakhir sesuai ketentuan perundang-undangan yang berlaku.\n\n(2) Kesempatan untuk membeli kendaraan sebagaimana dimaksud pada Ayat (1) hanya 1 (satu) kali kecuali tenggang waktu 10 (sepuiuh) tahun.\n\n(3)  Penjualan Kendaraan perorangan dinas sebagaimana dimaksud Ayat (1) pasal ini tidak boleh mengganggu pelaksanaan tugas dinas di Daerah.\n\nPasal 23\n\n(1) Kendaraan operasional dinas yang berumur 5 (lima) tahun atau lebih yang karena rusak dan/atau tidak efisien lagi bagi keperluan dinas dapat dijual kepada pegawal negeri yang telah memenuhi masa kerja sekurang-kurangnya 5 (lima) tahun.\n\n(2)  Pegawai pemegang kendaraan atau yang lebih senior mendapat prioritas       untuk membeli kendaraan sebagaimana climaksud pada ayat (1) pasal ini.\n\nPasal 24\n\n(1) Kendaraan Perorangan Dinas dan kendaraan operasional dinas yang\n\ndigunakan Anggota  DPRD dapat dijual kepada yang bersangkutan yang\n\nmempunyal masa bakti 5 (lima) tahun dan umur kendaraan 5 (lima) tahun.\n\n(2) Kesempatan untuk membeli kendaraan sebagaimana dimaksud pada Ayat (1) hanya 1 (satu) kali kecuali tenggang waktu 10 (sepuiuh) tahun.\n\nPasal 25\n\n(1) Pelaksanaan penjualan Kendaraan perorangan dinas kepada pejabat Pemerintah Daerah sebagaimana dimaksud Pasal 22 dan kendaraan operasional dinas sebagaimana dimaksud Pasal 23 dan 24 ditetapkan dengan Keputusan Gubernur setelah mendapat persetujuan DPRD.\n\n(2) Hasil penjualan harus disetorkan sepenuhnya ke Kas Daerah.\n\n(3)  Penghapusan dari inventarisasi ditetapkan dengan Keputusan Gubernur setelah harga penjualan/sewa beli kendaraan dimaksud dilunasi.\n\nPasal 26\n\n(1)\n\n(1) Selama harga penjualan kendaraan dinas sebagaimana dimaksud dalam Pasal 21, 22, 23, dan pasal 24 beium_dilunasi, kendaraan tersebut masih tetap milik Pemerintah Daerah, tidak boleh dipindahtangankan dan se-lama itu harus dipergunakan untuk kepentingan dinas, sedangkan biaya perbaikan/pemeliharaan ditanggung oieh pembeli.\n\n(2) Bagi mereka yang tidak dapat memenuhi kewajibannya sebagaimana dimaksud pada ayat.  (1) pasal ini, sesual dengan waktu yang telah ditentukan dapat dicabut haknya untuk membeli kendaraan dimaksud, selanjutnya kendaraan tersebut tetap milik Pemerintah Daerah.\n\nBagian Ketiga\n\nPenjualan Rumah Daerah\n\nPasal 27\n\nGubernur menetapkan penggunaan rumah-rumah Milik Daerah dengan memperhatikan peraturan perundang-undangan yang berlaku tentang perubahan/penetapan status Rumah-rumah Nageri sesuai dengan\n\nperaturan perundang-undangan yang berlaku.\n\nPasal 28\n\n(1)  Rumah Daerah golongan III yang telah berumur 10 (sepuluh) tahun atau lebih dapat dijual/disewa belikan kepada pegawai.\n\n(2) Pegawai yang dapat mambeli adalah pegawai sebagaimana dimaksud dalam Peraturan Pemerintah Nomor 40 tahun 19941 sudah mempunyai masa kerja 10 (sepuluh) tahun atau lebih dan belum pernah membell atau memperoleh rumah dengan cara apapun dari Pemerintah Daerah atau Pemerintah Pusat.\n\n(3) Pegawai yang dapat membell rumah adalah penghuni pemegang Surat Ijin Penghunian (SIP) yang dikeluarkan oleh Gubernur.\n\n(4) Rumah dimaksud tidak sedang dalam sengketa.\n\n(5) Rumah Daerah yang dibangun di atas tanah yang tidak dikuasai oleh                                           Pemerintah Daerah, maka untuk perolehan Hak Atas Tanah tersebut                                     harus diproses tersendiri sesuai dengan ketentuan peraturan\n\nperundang-undangan yang berlaku.\n\nPasal 29\n\n(1) Harga Rumah Daerah Golongan III beserta atau tidak beserta tanahnya ditetapkan oleh Gubernur berdasarkan harga taksiran dan penilaian yang dilakukan oleh Panitia yang dibentuk dengan Keputusan Gubemur.\n\n(2) Pelaksanaan penjualan/sewabeli Rumah Daerah Golongan III ditetapkan dengan Keputusan Gubernur setelah mendapat persetujuan DPRD.\n\nPasal 30\n\n(1) Hasil penjualan rumah Daerah Golongan III milik Daerah sebagaimana dimaksud dalam Pasal 30 disetorkan sepenuhnya ke Kas Daerah.\n\n(2) Pelepasan hak atas tanah dan penghapusan dari Daftar Inventaris ditetapkan dengan Keputusan Gubernur setelah harga penjualan/sewa beli atas tanah dan atau bangunannya dilunasi.\n\nBagian Keempat\n\nPelepasan Hak Atas Tanah dan atau Bangunan\n\nPasal 31\n\n(1)   Setiap tindakan hukum yang bertujuan untuk pengalihan atau penyerahan hak atas tanah dan atau bangunan yang dikuasai oleh Daerah, balk yang telah ada sertifikatnya maupun belum, dapat diproses , dengan pertimbangan menguntungkan Pemerintah Daerah bersangkutan dengan cara :\n\na. Pelepasan dengan pembayaran ganti rugi ( dijual ) b. Pelepasan dengan tukar menukar / ruislag / tukar guling.\n\n. (2) Pelepasan hak atas tanah sebagai dimaksud Ayat (1), pelaksanaannya ditetapkan oleh Gubernur setelah mendapat persetujuan DPRD.\n\n(3) Perhitungan perkiraan nilai tanah harus menguntungkan Pemerintah Daerah dengan memperhatikan nilai jual obyek pajak, dan atau harga umum setempat.\n\n(4) Nilai ganti rugi atas tanah dan atau bangunan ditetapkan oleh Gubernur berdasarkan nilai /harga taksiran yang dilakukan oleh Panitia Penaksir yang dibentuk dengan Keputusan Gubernur.\n\n(5) Ketentuan dalam pasal inl tidak berlaku bagi pelepasan hak atas tanah yang telah ada bangunan Rumah Golongan III di atasnya.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "8",
    nama_bab: "PEMANFAATAN",
    desc: "Bagian Pertama\n\nPasal 32\n\n(1) Untuk kepentingan penyelenggaraan Pemerintahan di Daerah, Barang Daerah baik bergerak maupun tidak bergerak dapat dipinjam pakaikan.\n\n(2) Pelaksanaan pinjam pakai sebagai mana dimaksud ayat (1) pasal diatur dengan Keputusan Gubemur dan tembusan dIsampalkan kepada DPRD.\n\nBagian ke dua\n\nPenyewaan\n\nPasal 33\n\n(1) Barang milik/dikuasai Pemerintah Daerah, baik barang bergerak maupun tidak bergerak dapat disewakan kepada Pihak Ketiga sepanjang menguntungkan Daerah.\n\n(2) Penyewaan sebagaimana dimaksud Ayat (1) pasal inl ditetapkan dengan Keputusan Gubernur dan tembusannya diberitahukan kepada DPRD.\n\nBagian Ketiga\n\nPengguna Usahaan\n\nPasal 34\n\n(1) Barang Daerah yang dlgunausahakan dalam bentuk kerja sama dengan Pihak Ketiga diatur oleh Guberniir.\n\n(2) Barang Daerah sebagaimana dimaksud Ayat (1) pasal inl dibuat Daftar Inventaris tersendiri.\n\nBagian Keempat\n\nS w a d a n a\n\nPasal 35\n\n(1) Barang Daerah baik barang bergerak maupun tidak bergerak dapat\n\ndi kelola secara swadana.\n\n(2) Pengelolaan sebagaimana dimaksud Ayat (1) pasal ini diatur oleh Gubernur.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "9",
    nama_bab: "PENGAMANAN",
    desc: "Pasal 36\n\n(1) Pengamanan Barang Daerah dapat dilakukan secara fisik, administratif dan tindakan hukum.\n\n(2) Pengamanan administratif dilakukan dengan melengkapi sertifikat dan kelengkapan bukti-bukti kepemilikan.\n\n(3) Pengamanan fisik dilakukan dengan pemagaran dan pemasangan tanda kepemilikan barang.\n\n(4) Pengamanan tindakan hukum dilakukan dengan upaya hukum.\n\n(5) Pengaturan pengmanan sebagaimana dimaksud pada Ayat (1) ditetapkan dengan Keputusan Gubernur.\n\nPasal 37\n\nBarang Daerah dapat diasuransikan sesuai dengan kemampuan keuangan Daerah dan ditetapkan berdasarkan Keputusan Gubernur sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "10",
    nama_bab: "PEMBINAAN, PENGENDALIAN DAN PENGAWASAN",
    desc: "Pasal . 38\n\n(I) Pembinaan terhadap tertib pelaksanaan pengelolaan barang Daerah dilakukan sesuai dengan peraturan perundang-undangan yang berlaku.\n\n(2) Pengendalian terhadap tertib pelaksanaan Perge-lolaan Barang Daerah dilakukan oleh Gubernur dalam hal ini dilaksanakan oleh Kepala Biro Perlengkapan, Kepala Unit Kerja sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.\n\n- 18 -\n\n(3) Pengawasan terhadap pengelolaan Barang Daerah dilakukan oleh Gubemur.\n\n(4) Pengawasan fungsional dilakukan oleh aparat pengawas fungsional sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "11",
    nama_bab: "PEMBIAYAAN",
    desc: "Pasal 39\n\n(1)   Dalam pelaksanaan tertib pengelolaan Barang Daerah, perlu penyediaan biaya yang dibebankan pada APBD.\n\n(2) Pengelolaan Barang Daerah yang mengakibatkan pendapatan dan\n\npenerimaan Daerah dapat diberikan biaya operasional, monitoring evaluasi dan insentif kepada aparat yang besarnya ditetapkan dengan Keputusan Gubemur.\n\n(3) Bendaharawan Barang, pengurus barang dan Kepala Gudang dalam melaksanakan tugas .dengan memperhatikan kemampuan keuangan Daerah dapat diberikan tunjangan insentif yang besarnya ditetapkan dengan Keputusan Gubernur.",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "12",
    nama_bab: "TUNTUTAN PERBENDAHARAAN DAN TUNTUTAN GANTI RUGI BARANG",
    desc: "Pasal 40\n\nDalam hal terjadi kerugian Daerah karena kekurangan perbendaharaan barang dan atau disebabkan perbuatan melanggar hukum/melalaikan kewajiban sebagaimana mestinya, diselesaikan Melalui Tuntutan Perbendaharaan dan Tuntutan Ganti Rugi Uang/Barang Daerah sesuai dengan ketentuan peraturan perundang-undangan yang berlaku..",
  },
  {
    name: "Pengelolaan Barang Daerah",
    perda: "Perda 4/2001",
    no_bab: "13",
    nama_bab: "KETENTUAN PENUTUP",
    desc: "Pasal 41\n\nDengan berlakunya Peraturan Daerah ini maka peraturan-peraturan yang mengatur pengelolaan barang Daerah yang bertentangan dengan Peraturan Daerah ini dinyatakan tidak berlaku lagl.\n\nPasal 42\n\nHal-hal yang belum diatur dalam Peraturan Daerah ini, sepanjang mengenai pelaksanaannya ditetapkan lebih lanjut oleh Gubernur.\n\nPasal 43\n\nPeraturan Daerah ini mulai berlaku pada tanggal diundangkan.",
  },
];

router.get("/uploadChunksAset", async (req, res) => {
  console.log("halaman uploadChunksAset");

  const perdaName = chunksData[0].perda;

  try {
    const uploadChunks = await uploadAsetChunksToMongo(chunksData, perdaName);
    res.send(uploadChunks);
  } catch (error) {}
});

router.get("/removeAsetPerda", async (req, res) => {
  console.log("halaman removeAsetPerda");

  // const perdaName = 'Perda 4/2001';
  // const perdaName = 'Perda 6/2008';
  // const perdaName = 'Pergub 78/2014';
  const perdaName = "Pergub 20/2021";

  try {
    await removePerdaChunks(perdaName);
    res.send(`${perdaName} chunks were removed from mongo db and pinecone vdb`);
  } catch (error) {}
});

router.get("/getAllAset", async (req, res) => {
  console.log(`halaman getAllAset`);
  const listAset = await getAllAset();
  res.send(listAset);
});

router.get("/processAsetEmbeddings", async (req, res) => {
  console.log(`halaman processAsetEmbeddings`);

  try {
    const embeddedChunks = await processAsetEmbeddings();
    res.send(embeddedChunks);
  } catch (error) {
    // res.status(500).send(error);
  }
});

router.post("/getAsetCandidate/:topK", async (req, res) => {
  console.log("halaman getAsetCandidate");

  const query = req.body.query;
  const topK = parseInt(req.params.topK);

  try {
    const asetCandidate = await getAsetCandidate(query, topK);
    asetCandidate.forEach((item) => {
      delete item.desc;
    });
    res.send({ candidates: asetCandidate });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/asetQA/:model/:topK", async (req, res) => {
  console.log("halaman asetQA");

  const model = req.params.model;
  const topK = parseInt(req.params.topK);
  console.log(req.body);
  const query = req.body.query;
  
  try {
    const queryResult = await processAsetQuery(query, model, topK);
    if (!queryResult) {
      res.status(400).send("Internal error processing LLM request");
      return;
    }

    queryResult.map(async (itemStream) => {
      try {
        for await (const chunk of itemStream.penjelasan.stream) {
          try{
            const chunkText = chunk.text();
            // console.log('\nchunk stream response: id', itemStream.id);
            // console.log(chunkText);
            res.write(
              JSON.stringify({
                id: itemStream.id,
                penjelasan: chunkText,
              })
            );
          }catch(error){
            console.log(error)
          }
        }
      } catch (error) {
        console.log(error);
      }
    });

    console.log("Listen...");
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }

  // res.status(400).send(new Error('coba error'));
});

// input BUMD
router.post("/admin/inputBUMD", async (req, res) => {
  console.log('halaman /admin/inputBUMD');

  const dataInput = req.body;
  // console.log(dataInput);

  await inputDataBUMDObject(dataInput);

  res.send('done');
});

// hapus BUMD
router.post("/admin/removeSelectedBUMD", async (req, res) => {
  console.log("halaman /admin/removeSelectedBUMD");
  
  const chunksID = req.body;
  // console.log(chunksID);

  await removeSelectedBUMD(chunksID);

  res.send('done');
});

// input Aset
router.post("/admin/inputAset", async (req, res) => {
  console.log("halaman /admin/inputAset");

  const dataInput = req.body;
  // console.log(dataInput);

  await inputDataAsetObject(dataInput);
  
  res.send('done');
});

// hapus Aset chunk
router.post("/admin/removeSelectedAsetChunks", async (req, res) => {
  console.log("halaman /admin/removeSelectedAsetChunks");
  
  const chunksID = req.body;
  // console.log(chunksID);

  await removeSelectedAsetChunks(chunksID);

  res.send('done');
});

router.get("/getAllBUMDID", async (req, res) => {
  console.log(`halaman getAllBUMDID`);
  const listBUMD = await getAllBUMD();
  const listBUMDID = listBUMD.map(item => {
    return item._id;
  });
  res.send(listBUMDID);
});

router.get("/getAllBUMDVector", async (req, res) => {
  console.log('halaman getAllBUMDVector');
  try {
    const result = await getAllBUMDVector();
    res.send(result);
  } catch (error) {
    res.send(error.message)
  };
});

router.get("/getAllBUMDVectorID", async (req, res) => {
  console.log('halaman getAllBUMDVectorID');
  try {
    const result = await getAllBUMDVector();
    const resultID = result.matches.map(item => {
      return item.id;
    })
    res.send(resultID);
  } catch (error) {
    res.send(error.message)
  };
});

router.get("/getAllAsetID", async (req, res) => {
  console.log(`halaman getAllAsetID`);
  const listAset = await getAllAset();
  const listAsetID = listAset.map(item => {
    return item._id;
  });
  res.send(listAsetID);
});

router.get("/getAllAsetVector", async (req, res) => {
  console.log('halaman getAllAsetVector');
  try {
    const result = await getAllAsetVector();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  };
});

router.get("/getAllAsetVectorID", async (req, res) => {
  console.log('halaman getAllAsetVectorID');
  try {
    const result = await getAllAsetVector();
    const resultID = result.matches.map(item => {
      return item.id;
    })
    res.send(resultID);
  } catch (error) {
    res.send(error.message)
  };
});