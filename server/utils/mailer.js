const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || user === 'your_email@gmail.com' || !pass) {
    return null; // dev fallback — log to console
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });
};

// ─── Core sendEmail ───────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return { messageId: 'dev-mode' };
  }
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'VoyageAI <noreply@voyageai.com>',
    to,
    subject,
    html,
  });
  console.log(`📧 Email sent to ${to} | messageId: ${info.messageId}`);
  return info;
};

// ─── Verification email ───────────────────────────────────────────────────────
exports.sendVerificationEmail = async (email, name, token, clientUrl) => {
  const url = `${clientUrl}/auth/verify-email/${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify your VoyageAI account',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #818cf8; font-size: 28px; margin: 0;">✈️ VoyageAI</h1>
        </div>
        <h2 style="color: #f1f5f9;">Welcome aboard, ${name}! 🎉</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Thank you for joining VoyageAI. Please verify your email address to get started.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="background: linear-gradient(135deg, #818cf8, #6366f1); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  });
};

// ─── Password reset email ─────────────────────────────────────────────────────
exports.sendPasswordResetEmail = async (email, name, token, clientUrl) => {
  const url = `${clientUrl}/auth/reset-password/${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your VoyageAI password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #818cf8; font-size: 28px; margin: 0;">✈️ VoyageAI</h1>
        </div>
        <h2 style="color: #f1f5f9;">Password Reset Request</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Hi ${name}, we received a request to reset your password. Click the button below to create a new password.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="background: linear-gradient(135deg, #f43f5e, #e11d48); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
      </div>
    `,
  });
};

// ─── Booking confirmation email (rich HTML) ───────────────────────────────────
exports.sendBookingConfirmationEmail = async (email, name, booking) => {
  const fmt = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const fmtCurrency = (amt) => `₹${Number(amt || 0).toLocaleString('en-IN')}`;

  const hotelName = booking.hotelName || booking.hotel?.name || 'Hotel';
  const city = booking.hotelCity || booking.hotel?.city || '';
  const nights = booking.nights || 1;
  const guests = booking.guests?.adults
    ? `${booking.guests.adults} adult${booking.guests.adults > 1 ? 's' : ''}${booking.guests.children ? ` + ${booking.guests.children} child` : ''}`
    : '1 guest';

  return sendEmail({
    to: email,
    subject: `Hotel Booking Confirmed — ${booking.bookingReference}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Inter','Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">

    <!-- Header -->
    <div style="text-align:center;padding:32px 0 24px;">
      <h1 style="margin:0;font-size:26px;color:#818cf8;letter-spacing:-0.5px;">✈️ VoyageAI</h1>
      <p style="margin:6px 0 0;color:#475569;font-size:13px;">AI-Powered Travel Planner</p>
    </div>

    <!-- Success Banner -->
    <div style="background:linear-gradient(135deg,#065f46,#047857);border-radius:16px;padding:28px 32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h2 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Booking Confirmed!</h2>
      <p style="margin:8px 0 0;color:#6ee7b7;font-size:14px;">Hello ${name}, your hotel booking has been confirmed.</p>
    </div>

    <!-- Booking Reference -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px 24px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
      <p style="margin:0;color:#818cf8;font-size:22px;font-weight:700;font-family:monospace;letter-spacing:1px;">${booking.bookingReference}</p>
    </div>

    <!-- Hotel Info -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="margin:0 0 16px;color:#f1f5f9;font-size:16px;">🏨 Hotel Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:45%;">Hotel</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${hotelName}</td></tr>
        ${city ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">City</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;text-transform:capitalize;">${city}</td></tr>` : ''}
        ${booking.roomName ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Room Type</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;">${booking.roomName}</td></tr>` : ''}
      </table>
    </div>

    <!-- Stay Details -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="margin:0 0 16px;color:#f1f5f9;font-size:16px;">📅 Stay Details</h3>
      <div style="display:grid;gap:12px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:45%;">Check-in</td><td style="padding:8px 0;color:#4ade80;font-size:14px;font-weight:600;">${fmt(booking.checkIn)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Check-out</td><td style="padding:8px 0;color:#f87171;font-size:14px;font-weight:600;">${fmt(booking.checkOut)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Duration</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;">${nights} night${nights > 1 ? 's' : ''}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Guests</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;">${guests}</td></tr>
        </table>
      </div>
    </div>

    <!-- Price Summary -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="margin:0 0 16px;color:#f1f5f9;font-size:16px;">💰 Price Summary</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:45%;">Price per night</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;">${fmtCurrency(booking.pricePerNight)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Nights</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;">${nights}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Subtotal</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;">${fmtCurrency(booking.totalAmount)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">GST (12%)</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;">${fmtCurrency(booking.taxes)}</td></tr>
        <tr style="border-top:1px solid #334155;">
          <td style="padding:12px 0 8px;color:#f1f5f9;font-size:15px;font-weight:700;">Total Amount</td>
          <td style="padding:12px 0 8px;color:#818cf8;font-size:18px;font-weight:700;">${fmtCurrency(booking.finalAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- Status Badge -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;background:#14532d;color:#4ade80;padding:8px 24px;border-radius:50px;font-size:14px;font-weight:600;border:1px solid #16a34a;">
        ✓ Status: Confirmed
      </span>
    </div>

    <!-- Important Notice -->
    <div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#93c5fd;font-size:13px;line-height:1.6;">
        <strong>📝 Please note:</strong> This is a simulated booking for portfolio demonstration purposes.
        Please present your Booking Reference <strong>${booking.bookingReference}</strong> at check-in.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0;border-top:1px solid #1e293b;">
      <p style="margin:0;color:#475569;font-size:13px;">Thank you for choosing <strong style="color:#818cf8;">VoyageAI</strong>!</p>
      <p style="margin:6px 0 0;color:#334155;font-size:12px;">AI-Powered Travel Planning • Plan • Book • Explore</p>
    </div>

  </div>
</body>
</html>`,
  });
};

// ─── Test email (for verifying SMTP setup) ───────────────────────────────────
exports.sendTestEmail = async (to) => {
  return sendEmail({
    to,
    subject: 'AI Trip Planner — Test Email ✅',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <h1 style="color: #818cf8; text-align: center;">✈️ VoyageAI</h1>
        <div style="background: #14532d; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <h2 style="color: #4ade80; margin: 0;">📧 Email Working!</h2>
        </div>
        <p style="color: #94a3b8; line-height: 1.8;">This email was sent using:</p>
        <ul style="color: #94a3b8; line-height: 2;">
          <li>Node.js + Express</li>
          <li>Nodemailer</li>
          <li>Gmail SMTP</li>
        </ul>
        <p style="color: #64748b; font-size: 13px; margin-top: 24px;">Sent at: ${new Date().toLocaleString('en-IN')}</p>
      </div>
    `,
  });
};
