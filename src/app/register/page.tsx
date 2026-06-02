import Link from "next/link";
import { requestLoginCodeAction } from "@/app/actions/auth";
import { Notice } from "@/components/Notice";

export default function RegisterPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Acceso Grupalia</h1>
        <p className="mt-1 text-sm text-slate-600">
          Escribe tu correo @grupalia.com y confirma el código que te enviaremos.
        </p>
      </div>
      <Notice error={searchParams.error} />
      <form action={requestLoginCodeAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Correo Grupalia</span>
          <input
            name="email"
            type="email"
            required
            pattern=".+@grupalia[.]com"
            placeholder="tu.nombre@grupalia.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <button className="w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700">
          Enviar código
        </button>
      </form>
      <p className="text-sm text-slate-600">
        ¿Prefieres la página de entrada?{" "}
        <Link className="font-medium text-violet-700" href="/login">
          Entrar
        </Link>
      </p>
    </div>
  );
}
