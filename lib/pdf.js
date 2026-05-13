const PDFDocument = require("pdfkit");

const COLORS = {
  ink: "#08111F",
  navy: "#07111F",
  gold: "#FF4D4D",
  amber: "#22D3EE",
  emerald: "#14B8A6",
  teal: "#22D3EE",
  softWhite: "#F8FAFC",
  cream: "#F5F3FF",
  muted: "#64748B"
};

function addSectionTitle(doc, title) {
  doc.moveDown(1.2);
  doc
    .fillColor(COLORS.navy)
    .fontSize(15)
    .font("Helvetica-Bold")
    .text(title);
  doc
    .moveTo(doc.x, doc.y + 4)
    .lineTo(535, doc.y + 4)
    .strokeColor(COLORS.gold)
    .lineWidth(1.2)
    .stroke();
  doc.moveDown(0.7);
}

function drawPill(doc, label, value, color) {
  const y = doc.y;
  doc.roundedRect(55, y, 235, 52, 6).fill("#FFFFFF");
  doc.rect(55, y, 4, 52).fill(color);
  doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica-Bold").text(label.toUpperCase(), 72, y + 11);
  doc.fillColor(COLORS.ink).fontSize(17).font("Helvetica-Bold").text(value, 72, y + 27, { width: 190 });
}

function addBulletList(doc, items, color = COLORS.gold) {
  items.forEach((item) => {
    doc.fillColor(color).fontSize(11).text("-", 72, doc.y, { continued: true });
    doc.fillColor(COLORS.ink).fontSize(10.5).font("Helvetica").text(`  ${item}`, { width: 430 });
    doc.moveDown(0.35);
  });
}

function generateDiagnosticPdf({ prospect, score, bookingLink }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 55 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, 612, 126).fill(COLORS.navy);
    doc.rect(0, 119, 612, 7).fill(COLORS.gold);
    doc
      .fillColor(COLORS.gold)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("SALESSTACK MARKETING", 55, 36, { letterSpacing: 0.5 });
    doc
      .fillColor("#FFFFFF")
      .fontSize(25)
      .font("Helvetica-Bold")
      .text("Your SalesStack Customer Flow Diagnostic Report", 55, 56, { width: 440 });
    doc
      .fillColor("#CBD5E1")
      .fontSize(10.5)
      .font("Helvetica")
      .text("Generate better leads. Follow up faster. Convert more customers.", 55, 94);

    doc.y = 154;
    drawPill(doc, "Overall Score", `${score.scorePercentage}%`, COLORS.emerald);
    drawPill(doc, "Result Level", score.resultLevel, COLORS.gold);
    doc.moveDown(4.4);

    doc
      .fillColor(COLORS.ink)
      .fontSize(11)
      .font("Helvetica")
      .text(`Prepared for ${prospect.name}`, 55, doc.y);
    doc
      .fillColor(COLORS.muted)
      .text(`${prospect.businessName} - ${prospect.businessType}`);

    addSectionTitle(doc, "Executive Insight");
    doc
      .fillColor(COLORS.ink)
      .fontSize(11)
      .font("Helvetica")
      .text(
        "More leads alone won't fix growth. Better systems will. Your score shows how predictable your current customer flow is across lead generation, capture, response, follow-up, booking conversion, and retention.",
        { lineGap: 3 }
      );

    addSectionTitle(doc, "Category Breakdown");
    Object.entries(score.categoryScores).forEach(([category, details]) => {
      const x = 55;
      const y = doc.y;
      doc.fillColor(COLORS.ink).fontSize(10.5).font("Helvetica-Bold").text(category, x, y);
      doc.fillColor(COLORS.muted).font("Helvetica").text(`${details.score}/3`, 465, y, { width: 70, align: "right" });
      doc.roundedRect(x, y + 17, 480, 8, 4).fill("#E2E8F0");
      doc.roundedRect(x, y + 17, Math.max(8, 480 * (details.percentage / 100)), 8, 4).fill(details.score >= 2 ? COLORS.emerald : COLORS.amber);
      doc.y = y + 35;
    });

    addSectionTitle(doc, "Detected Revenue Leaks");
    addBulletList(doc, score.detectedGaps.length ? score.detectedGaps : ["Your answers show a strong foundation. The next move is optimization and scale."], COLORS.amber);

    addSectionTitle(doc, "Recommended Fixes");
    addBulletList(doc, score.recommendedFixes.length ? score.recommendedFixes : ["Keep improving speed, automation, conversion tracking, and repeat-customer campaigns."], COLORS.teal);

    addSectionTitle(doc, "Book Your Free SalesStack Revenue Review");
    doc
      .fillColor(COLORS.ink)
      .fontSize(11)
      .font("Helvetica")
      .text("On this free review, we'll look at your lead generation, response speed, follow-up, booking process, and retention gaps, then show you what to fix first.", { lineGap: 3 });
    doc.moveDown(0.5);
    doc.fillColor(COLORS.gold).fontSize(11).font("Helvetica-Bold").text(bookingLink || "https://yourbookinglink.com");

    doc.rect(0, 740, 612, 52).fill(COLORS.navy);
    doc
      .fillColor("#FFFFFF")
      .fontSize(9.5)
      .font("Helvetica")
      .text("SalesStack Marketing - Generate better leads. Follow up faster. Convert more customers.", 55, 761, { width: 500, align: "center" });

    doc.end();
  });
}

module.exports = {
  generateDiagnosticPdf
};


