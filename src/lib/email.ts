import nodemailer from "nodemailer";

function requiredEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : null;
}

async function sendWithResend(email: string, code: string) {
  const apiKey = requiredEnv("RESEND_API_KEY");
  if (!apiKey) return false;

  const from =
    requiredEnv("RESEND_FROM") ??
    requiredEnv("SMTP_FROM") ??
    "PolliQuiniela Mundialista <quiniela@grupalia.com>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "polliquiniela-mundialista"
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Código para entrar a la quiniela",
      text: `Tu código para entrar a la quiniela es: ${code}\n\nEste código vence en 10 minutos.`,
      html: `
        <p>Tu código para entrar a la quiniela es:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
        <p>Este código vence en 10 minutos.</p>
      `
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${detail}`);
  }

  return true;
}

export async function sendLoginCodeEmail(email: string, code: string) {
  const sentWithResend = await sendWithResend(email, code);
  if (sentWithResend) return;

  const host = requiredEnv("SMTP_HOST");
  const from = requiredEnv("SMTP_FROM") ?? "quiniela@grupalia.com";

  if (!host) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV LOGIN CODE] ${email}: ${code}`);
      return;
    }

    throw new Error("SMTP_HOST is required to send login codes.");
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASS");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: user && pass ? { user, pass } : undefined
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: "Código para entrar a la quiniela",
    text: `Tu código para entrar a la quiniela es: ${code}\n\nEste código vence en 10 minutos.`,
    html: `
      <p>Tu código para entrar a la quiniela es:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
      <p>Este código vence en 10 minutos.</p>
    `
  });
}
