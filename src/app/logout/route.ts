import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/auth";

export function GET() {
  clearSessionCookie();
  redirect("/login");
}
