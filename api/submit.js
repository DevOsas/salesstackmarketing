const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { calculateScore, QUESTIONS } = require("../lib/scoring");
const { generateDiagnosticPdf } = require("../lib/pdf");
const { sendProspectReport, sendAdminNotification } = require("../lib/email");

function sanitize(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 300);
}

function getBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  return {};
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function postToZapier(payload) {
  if (!process.env.ZAPIER_WEBHOOK_URL) return;

  try {
    await axios.post(process.env.ZAPIER_WEBHOOK_URL, payload, { timeout: 5000 });
  } catch (error) {
    console.error("Zapier webhook failed:", error.message);
  }
}

function storeLocally(payload) {
  try {
    const filePath = path.join(process.cwd(), "data", "submissions.jsonl");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, "utf8");
  } catch (error) {
    console.error("Local submission storage failed:", error.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  try {
    const body = getBody(req);
    const prospect = {
      name: sanitize(body.name),
      email: sanitize(body.email).toLowerCase(),
      phone: sanitize(body.phone),
      businessName: sanitize(body.business_name || body.businessName),
      businessType: sanitize(body.business_type || body.businessType)
    };
    const answers = body.answers || {};

    const missing = [
      prospect.name,
      prospect.email,
      prospect.phone,
      prospect.businessName,
      prospect.businessType
    ].some((value) => !value);

    if (missing || !validateEmail(prospect.email)) {
      return res.status(400).json({ success: false, message: "Please complete all required fields." });
    }

    const validQuestionIds = new Set(QUESTIONS.map((question) => question.id));
    const sanitizedAnswers = Object.fromEntries(
      Object.entries(answers)
        .filter(([key]) => validQuestionIds.has(key))
        .map(([key, value]) => [key, sanitize(value)])
    );

    if (Object.keys(sanitizedAnswers).length !== QUESTIONS.length) {
      return res.status(400).json({ success: false, message: "Please answer every diagnostic question." });
    }

    const score = calculateScore(sanitizedAnswers);
    const bookingLink = process.env.BOOKING_LINK || "https://yourbookinglink.com";
    const redirectUrl = process.env.RESULT_PAGE_URL || "/result.html";
    const submittedAt = new Date().toISOString();
    const pdfBuffer = await generateDiagnosticPdf({ prospect, score, bookingLink });

    await sendProspectReport({ prospect, score, pdfBuffer, bookingLink });
    await sendAdminNotification({ prospect, score, answers: sanitizedAnswers, bookingLink });

    const payload = {
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone,
      business_name: prospect.businessName,
      business_type: prospect.businessType,
      total_score: score.totalScore,
      score_percentage: score.scorePercentage,
      result_level: score.resultLevel,
      category_scores: score.categoryScores,
      detected_gaps: score.detectedGaps,
      answers: sanitizedAnswers,
      submitted_at: submittedAt
    };

    storeLocally(payload);
    await postToZapier(payload);

    return res.status(200).json({
      success: true,
      score_percentage: score.scorePercentage,
      result_level: score.resultLevel,
      redirect_url: redirectUrl
    });
  } catch (error) {
    console.error("Diagnostic submission failed:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again."
    });
  }
};
