import { loadEnvConfig } from "@next/env";
import { sendLoginCodeEmail } from "../src/lib/email";

loadEnvConfig(process.cwd());

const email = process.argv[2]?.trim().toLowerCase();

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

async function main() {
  if (!email || !email.endsWith("@grupalia.com")) {
    console.error("Uso: npm run test:email -- correo@grupalia.com");
    process.exit(1);
  }

const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"].filter(
    (name) => !requiredEnv(name)
  );
  const hasResend = Boolean(requiredEnv("RESEND_API_KEY"));

  if (!hasResend && missing.length > 0) {
    console.error(
      `Faltan datos de correo en .env. O agrega RESEND_API_KEY, o agrega SMTP completo: ${missing.join(", ")}. No se puede enviar un correo real todavía.`
    );
    process.exit(1);
  }

  await sendLoginCodeEmail(email, "123456");
  console.log(`Correo de prueba enviado a ${email}. Código de prueba: 123456`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
