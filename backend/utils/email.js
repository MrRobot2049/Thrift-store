function resolveProxyUrl() {
  const baseUrl = (process.env.EMAIL_PROXY_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("EMAIL_PROXY_URL or FRONTEND_URL is missing in environment variables.");
  }

  return `${baseUrl}/api/send-email`;
}

function resolveApiKey() {
  if (!process.env.EMAIL_API_KEY) {
    throw new Error("EMAIL_API_KEY is missing in environment variables.");
  }

  return process.env.EMAIL_API_KEY;
}

async function sendMail(options) {
  const response = await fetch(resolveProxyUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": resolveApiKey(),
    },
    body: JSON.stringify({
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      from: options.from,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Email proxy request failed.");
  }

  return response.json().catch(() => ({}));
}

module.exports = {
  sendMail,
};
