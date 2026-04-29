const nodemailer = require("nodemailer");

function resolveApiKey() {
  if (!process.env.EMAIL_API_KEY) {
    throw new Error("EMAIL_API_KEY is missing.");
  }

  return process.env.EMAIL_API_KEY;
}

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing.");
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== resolveApiKey()) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { to, subject, text, html, from } = req.body || {};
    if (!to || !subject || (!text && !html)) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const transporter = createTransporter();
    const resolvedFrom = from || process.env.EMAIL_FROM || process.env.EMAIL_USER;

    await transporter.sendMail({
      from: resolvedFrom,
      to,
      subject,
      text,
      html,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Email proxy failed:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};
