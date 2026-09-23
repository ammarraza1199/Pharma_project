import nodemailer from 'nodemailer';
import { config } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // If live SMTP credentials exist in environment, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback transporter (never throws on dispatch)
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'genquantaa.pharmacy@ethereal.email',
        pass: 'genquantaaTest123!',
      },
    });
  }

  return transporter;
};

/**
 * Sends a password reset email containing the secure token and action link.
 */
export async function sendPasswordResetEmail(toEmail: string, resetToken: string): Promise<boolean> {
  try {
    const client = await getTransporter();
    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: '"Genquantaa MedPlus Pharmacy" <no-reply@genquantaa.com>',
      to: toEmail,
      subject: '🔑 Password Reset Request — Genquantaa Pharmacy POS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
          <h2 style="color: #0f766e; margin-bottom: 8px;">🏥 Genquantaa MedPlus Pharmacy</h2>
          <h3 style="color: #1e293b; margin-top: 0;">Password Reset Authorization</h3>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">
            A password reset was requested for your Pharmacist Terminal account (<strong>${toEmail}</strong>).
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${resetUrl}" style="background: #0f766e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.4;">
            Alternatively, your one-time reset security token is:<br />
            <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #0f172a;">${resetToken}</code>
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            This link expires in 15 minutes. If you did not request this, please notify your store manager immediately.
          </p>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`[EmailService] Password reset sent to ${toEmail}. MessageId: ${info?.messageId || 'SENT'}`);
    return true;
  } catch (err: any) {
    console.warn(`[EmailService] SMTP Dispatch note for ${toEmail}:`, err?.message || err);
    return false;
  }
}
