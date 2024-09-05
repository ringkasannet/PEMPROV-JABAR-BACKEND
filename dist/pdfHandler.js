"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docPerda = exports.parsePdf = void 0;
async function parsePdf(url) {
    console.log("parsing pdf from url:", url);
    try {
        if (!url) {
            throw new Error("No URL provided.");
        }
        const pdf = await parsePdfUrl(url);
        const text = await pdf.getAllTexts();
        return text;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}
exports.parsePdf = parsePdf;
exports.docPerda = "https://storage.googleapis.com/pemprov-jabar/BUMD%20-%20Peraturan%20Daerah%20Provinsi%20Jawa%20Barat%20Nomor%206%20Tahun%202021.pdf";
//# sourceMappingURL=pdfHandler.js.map