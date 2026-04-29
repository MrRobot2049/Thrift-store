const { sendMail } = require("./email");

/**
 * Send a styled ticket confirmation email.
 * @param {string} toEmail - recipient email
 * @param {object} purchase - purchase document
 */
async function sendTicketEmail(toEmail, purchase) {
  if (!process.env.EMAIL_API_KEY || !(process.env.EMAIL_PROXY_URL || process.env.FRONTEND_URL)) {
    console.warn("EMAIL_API_KEY or proxy URL not set — skipping ticket email.");
    return;
  }

  const typeEmoji = { merchandise: "🛍️", comedy: "🎤", event: "🎟️", concert: "🎸" };
  const emoji = typeEmoji[purchase.listingType] || "📦";

  const detailRows = [
    purchase.tierName && `<tr><td style="color:#7a5e3d;padding:6px 0">Ticket Tier</td><td style="font-weight:600;padding:6px 0">${purchase.tierName}</td></tr>`,
    purchase.size && `<tr><td style="color:#7a5e3d;padding:6px 0">Size</td><td style="font-weight:600;padding:6px 0">${purchase.size}</td></tr>`,
    purchase.venue && `<tr><td style="color:#7a5e3d;padding:6px 0">Venue</td><td style="font-weight:600;padding:6px 0">📍 ${purchase.venue}</td></tr>`,
    purchase.eventDate && `<tr><td style="color:#7a5e3d;padding:6px 0">Date</td><td style="font-weight:600;padding:6px 0">📅 ${purchase.eventDate}</td></tr>`,
    purchase.headlineArtist && `<tr><td style="color:#7a5e3d;padding:6px 0">Artist</td><td style="font-weight:600;padding:6px 0">🎤 ${purchase.headlineArtist}</td></tr>`,
  ].filter(Boolean).join("");

  const html = `
  <div style="font-family:'Georgia',serif;background:#faf6eb;padding:40px;max-width:560px;margin:auto;border-radius:12px;border:2px solid #dabe82">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:3rem">${emoji}</div>
      <h1 style="color:#2b1d0f;margin:8px 0;font-size:1.6rem">Booking Confirmed!</h1>
      <p style="color:#7a5e3d;font-size:0.9rem">Your purchase was successful.</p>
    </div>

    <div style="background:#fff;border-radius:8px;border:1px solid #dabe82;padding:20px;margin-bottom:20px">
      <h2 style="color:#2b1d0f;margin:0 0 12px;font-size:1.2rem">${purchase.itemTitle}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
        <tr><td style="color:#7a5e3d;padding:6px 0">Quantity</td><td style="font-weight:600;padding:6px 0">${purchase.quantity}</td></tr>
        <tr><td style="color:#7a5e3d;padding:6px 0">Amount Paid</td><td style="font-weight:600;padding:6px 0;color:#2b7a0a">₹${purchase.totalPrice.toLocaleString("en-IN")}</td></tr>
        ${detailRows}
      </table>
    </div>

    <div style="background:#2b1d0f;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px">
      <div style="color:#dabe82;font-size:0.75rem;letter-spacing:2px;margin-bottom:6px">TICKET ID</div>
      <div style="color:#fff;font-size:1.4rem;font-weight:700;letter-spacing:4px;font-family:monospace">${purchase.ticketId}</div>
    </div>

    <p style="color:#9b8770;font-size:0.8rem;text-align:center">
      Show this email or Ticket ID at the venue. This is an auto-generated receipt — please do not reply.
    </p>
  </div>`;

  await sendMail({
    to: toEmail,
    subject: `✅ Booking Confirmed — ${purchase.itemTitle} [${purchase.ticketId}]`,
    html,
  });

  console.log(`📧 Ticket email sent to ${toEmail}`);
}

module.exports = sendTicketEmail;
