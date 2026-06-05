"use server";

import { createHash, randomInt, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { sendLoginCodeEmail } from "@/lib/email";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function isAllowedEmail(email: string) {
  return email.endsWith("@grupalia.com") && email.length > "@grupalia.com".length;
}

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "Usuario";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Usuario";
}

function createLoginCode() {
  if (process.env.NODE_ENV !== "production") {
    return process.env.AUTH_TEST_CODE ?? "111111";
  }

  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function isValidTestCode(code: string) {
  return (
    process.env.NODE_ENV !== "production" &&
    code === (process.env.AUTH_TEST_CODE ?? "111111")
  );
}

function hashLoginCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${email}:${code}:${process.env.AUTH_SECRET ?? "local-dev-secret-change-me"}`)
    .digest("hex");
}

function hashesMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function setupErrorUrl(path: string) {
  const message =
    "La base de datos de producción todavía no está configurada. Conecta Postgres en Vercel y aplica las tablas.";
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}error=${encodeURIComponent(message)}`;
}

export async function registerAction(formData: FormData) {
  return requestLoginCodeAction(formData);
}

export async function requestLoginCodeAction(formData: FormData) {
  const email = text(formData, "email").toLowerCase();

  if (!isAllowedEmail(email)) {
    redirect("/login?error=Solo se permiten correos @grupalia.com.");
  }

  const code = createLoginCode();
  try {
    await prisma.emailLoginCode.create({
      data: {
        email,
        codeHash: hashLoginCode(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error(error);
    redirect(setupErrorUrl("/login"));
  }

  try {
    await sendLoginCodeEmail(email, code);
  } catch (error) {
    console.error(error);
    redirect("/login?error=No pude enviar el código. Revisa la configuración de correo.");
  }

  redirect(
    `/login/verify?email=${encodeURIComponent(email)}&notice=${encodeURIComponent("Te enviamos un código de 6 dígitos. Revisa tu correo.")}`
  );
}

export async function verifyLoginCodeAction(formData: FormData) {
  const email = text(formData, "email").toLowerCase();
  const code = text(formData, "code").replace(/\D/g, "");

  if (!isAllowedEmail(email)) {
    redirect("/login?error=Solo se permiten correos @grupalia.com.");
  }

  if (code.length !== 6) {
    redirect(
      `/login/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Escribe el código de 6 dígitos.")}`
    );
  }

  let loginCode = null;

  try {
    loginCode = await prisma.emailLoginCode.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  } catch (error) {
    console.error(error);
    redirect(setupErrorUrl(`/login/verify?email=${encodeURIComponent(email)}`));
  }

  const submittedHash = hashLoginCode(email, code);
  const validCode =
    isValidTestCode(code) ||
    Boolean(loginCode && hashesMatch(loginCode.codeHash, submittedHash));

  if (!validCode) {
    redirect(
      `/login/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent("El código no es correcto o ya venció.")}`
    );
  }

  if (loginCode) {
    try {
      await prisma.emailLoginCode.update({
        where: { id: loginCode.id },
        data: { usedAt: new Date() }
      });
    } catch (error) {
      console.error(error);
      redirect(setupErrorUrl(`/login/verify?email=${encodeURIComponent(email)}`));
    }
  }

  let user;

  try {
    user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: nameFromEmail(email),
        email,
        passwordHash: "email-only-login"
      }
    });
  } catch (error) {
    console.error(error);
    redirect(setupErrorUrl(`/login/verify?email=${encodeURIComponent(email)}`));
  }

  setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  return requestLoginCodeAction(formData);
}

export async function logoutAction() {
  clearSessionCookie();
  redirect("/login");
}
