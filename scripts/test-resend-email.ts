import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const to = process.argv[2]?.trim();
const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";

async function main() {
  if (!apiKey) {
    console.error("Set RESEND_API_KEY first. Replace re_xxxxxxxxx with your real Resend API key.");
    process.exit(1);
  }

  if (!to) {
    console.error("Usage: npm run test:resend -- your-email@example.com");
    process.exit(1);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>"
    })
  });

  if (!response.ok) {
    console.error(await response.text());
    process.exit(1);
  }

  console.log(`Resend test email sent to ${to} from ${from}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
