import { prisma } from "@/lib/prisma";

function formatPrize(value: number | null) {
  if (!value || value <= 0) return null;

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

export async function FloatingPrizeBanner() {
  if (!process.env.DATABASE_URL?.trim()) return null;

  const prizeConfig = await prisma.prizeConfig
    .findUnique({
      where: { id: "default" }
    })
    .catch(() => null);

  const firstPrize = formatPrize(prizeConfig?.firstPlacePrize ?? null);
  const secondPrize = formatPrize(prizeConfig?.secondPlacePrize ?? null);

  if (!firstPrize && !secondPrize) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="animate-prize-float rounded-full border border-violet-200 bg-white/95 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_16px_40px_rgba(124,58,237,0.28)] backdrop-blur">
        🏆 {firstPrize ? `1er Lugar ${firstPrize}` : "1er Lugar por definir"}
        <span className="mx-3 text-violet-400">|</span>
        ⚽ {secondPrize ? `Segundo lugar ${secondPrize}` : "Segundo lugar por definir"}
      </div>
    </div>
  );
}
