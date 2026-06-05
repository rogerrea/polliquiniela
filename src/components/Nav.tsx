import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="px-3 pt-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.07)] sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3 text-lg font-black tracking-tight text-slate-950">
          <span className="relative inline-flex items-baseline">
            <span>PolliQuiniela</span>
            <span className="absolute -bottom-1 right-0 h-3 w-9 rounded-b-full border-b-4 border-violet-600" />
          </span>
          <span className="hidden text-sm font-semibold text-slate-500 md:inline">
            Mundialista - Grupalia
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {user ? (
            <>
              <Link className="rounded-full px-3 py-2 font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700" href="/dashboard">
                Inicio
              </Link>
              <Link className="rounded-full px-3 py-2 font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700" href="/predictions">
                Pronósticos
              </Link>
              <Link className="rounded-full px-3 py-2 font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700" href="/leaderboard">
                Tabla
              </Link>
              {user.isAdmin ? (
                <Link className="rounded-full px-3 py-2 font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700" href="/admin">
                  Admin
                </Link>
              ) : null}
              <span className="text-slate-400">Hola, {user.name}</span>
              <Link className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200" href="/logout">
                Salir
              </Link>
            </>
          ) : (
            <>
              <Link className="rounded-full px-3 py-2 font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700" href="/login">
                Entrar
              </Link>
              <Link className="rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.28)] hover:bg-violet-700" href="/register">
                Acceso Grupalia
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
