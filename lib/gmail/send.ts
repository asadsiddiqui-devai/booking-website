import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_SENDER_ADDRESS,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  await transporter.sendMail({
    from: `Wanderly <${process.env.GMAIL_SENDER_ADDRESS}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });
}
