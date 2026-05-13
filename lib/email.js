const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const sgMail = require("@sendgrid/mail");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function getFromEmail() {
  return process.env.FROM_EMAIL || "SalesStack Marketing <no-reply@example.com>";
}

async function sendWithSmtp(message) {
  const transporter = nodemailer.createTransport({
    host: requireEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS")
    }
  });

  return transporter.sendMail({
    from: getFromEmail(),
    ...message
  });
}

async function sendWithApi(message) {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({
      from: getFromEmail(),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: (message.attachments || []).map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64")
      }))
    });
  }

  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return sgMail.send({
      from: getFromEmail(),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: (message.attachments || []).map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
        type: "application/pdf",
        disposition: "attachment"
      }))
    });
  }

  throw new Error("RESEND_API_KEY or SENDGRID_API_KEY is required when EMAIL_PROVIDER=api");
}

async function sendEmail(message) {
  if ((process.env.EMAIL_PROVIDER || "api").toLowerCase() === "smtp") {
    return sendWithSmtp(message);
  }

  return sendWithApi(message);
}

function lineBreaksToHtml(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join("");
}

async function sendProspectReport({ prospect, score, pdfBuffer, bookingLink }) {
  const text = `Hi ${prospect.name},

Your SalesStack Customer Flow Diagnostic Report is attached.

It shows where your business may be losing leads, bookings, and repeat revenue - and what to fix first.

After reviewing it, you can book your free SalesStack Revenue Review here:
${bookingLink}

Regards,
SalesStack Marketing`;

  return sendEmail({
    to: prospect.email,
    subject: "Your SalesStack Customer Flow Diagnostic Report",
    text,
    html: lineBreaksToHtml(text),
    attachments: [
      {
        filename: "customer-flow-diagnostic-report.pdf",
        content: pdfBuffer
      }
    ]
  });
}

async function sendAdminNotification({ prospect, score, answers, bookingLink }) {
  if (!process.env.ADMIN_EMAIL) return null;

  const answerLines = score.answerDetails
    .map((item) => `${item.category}: ${item.answer} (${item.score}/3)`)
    .join("\n");

  const text = `New SalesStack Customer Flow Diagnostic Submission

Name: ${prospect.name}
Email: ${prospect.email}
Phone: ${prospect.phone}
Business name: ${prospect.businessName}
Business type: ${prospect.businessType}
Score: ${score.scorePercentage}% (${score.totalScore}/18)
Result level: ${score.resultLevel}
Detected gaps: ${score.detectedGaps.join(", ") || "None"}
Biggest risk area: ${score.biggestRiskArea}
Booking link: ${bookingLink}

Answers:
${answerLines}

Raw answers:
${JSON.stringify(answers, null, 2)}`;

  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: "New SalesStack Customer Flow Diagnostic Submission",
    text,
    html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${text}</pre>`
  });
}

module.exports = {
  sendProspectReport,
  sendAdminNotification
};


