import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const sessionCookieName = "world-cup-session";

function getSecret() {
  return process.env.AUTH_SECRET ?? "local-dev-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function verifySignature(value: string, signature: string) {
  const expected = sign(value);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createSessionValue(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export function readSessionUserId() {
  const rawValue = cookies().get(sessionCookieName)?.value;
  if (!rawValue) return null;

  const [userId, signature] = rawValue.split(".");
  if (!userId || !signature || !verifySignature(userId, signature)) {
    return null;
  }

  return userId;
}

export function setSessionCookie(userId: string) {
  cookies().set(sessionCookieName, createSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSessionCookie() {
  cookies().delete(sessionCookieName);
}

export async function getCurrentUser() {
  const userId = readSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      createdAt: true
    }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/dashboard");
  return user;
}
