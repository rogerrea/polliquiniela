import Link from "next/link";
import { verifyLoginCodeAction } from "@/app/actions/auth";
import { Notice } from "@/components/Notice";

export default function VerifyLoginPage({
  searchParams
}: {
  searchParams: { email?: string; error?: string; notice?: string };
}) {
  const email = searchParams.email ?? "";

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Código de acceso</h1>
        <p className="mt-1 text-sm text-slate-600">
          Escribe el código de 6 dígitos que enviamos a {email || "tu correo"}.
        </p>
      </div>
      <Notice error={searchParams.error} notice={searchParams.notice} />
      <form action={verifyLoginCodeAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Correo Grupalia</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={email}
            pattern=".+@grupalia[.]com"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Código</span>
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="123456"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-2xl tracking-[0.3em]"
          />
        </label>
        <button className="w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700">
          Confirmar y entrar
        </button>
      </form>
      <p className="text-sm text-slate-600">
        ¿Necesitas otro código?{" "}
        <Link className="font-medium text-violet-700" href="/login">
          Volver a pedirlo
        </Link>
      </p>
    </div>
  );
}
