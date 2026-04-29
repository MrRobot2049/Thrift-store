const { Resend } = require("resend");

let resendClient = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing in environment variables.");
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

function resolveFromAddress() {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is missing in environment variables.");
  }

  return process.env.EMAIL_FROM;
}

async function sendMail(options) {
  const client = getResendClient();
  const payload = {
    from: options.from || resolveFromAddress(),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  return client.emails.send(payload);
}

module.exports = {
  sendMail,
};
