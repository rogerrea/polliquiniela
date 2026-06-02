import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";
import { formatDateTime } from "@/lib/format";
import { isPredictionLocked } from "@/lib/predictionValidation";
import { isKnockoutStage } from "@/lib/stage";
import { TeamName } from "@/components/TeamName";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const leaderboard = await getLeaderboard();
  const userRow = leaderboard.find((row) => row.userId === user.id);

  const matches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      predictions: {
        none: {
          userId: user.id
        }
      }
    },
    include: {
      homeTeam: true,
      awayTeam: true
    },
    orderBy: { startsAt: "asc" }
  });

  const nextOpenMatches = matches
    .filter(
      (match) =>
        isKnockoutStage(match.stage) &&
        match.homeTeamId &&
        match.awayTeamId &&
        !isPredictionLocked(match)
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inicio</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tu resumen: lugar, puntos, pronósticos pendientes y líderes.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Tu lugar</p>
          <p className="mt-2 text-3xl font-bold">{userRow?.rank ?? "-"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Puntos totales</p>
          <p className="mt-2 text-3xl font-bold">{userRow?.totalPoints ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Marcadores exactos</p>
          <p className="mt-2 text-3xl font-bold">{userRow?.exactScoresCount ?? 0}</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Próximas eliminatorias sin tu pronóstico</h2>
          <Link href="/predictions" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700">
            Ir a pronósticos
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2">Partido</th>
                <th className="py-2">Grupo</th>
                <th className="py-2">Empieza</th>
              </tr>
            </thead>
            <tbody>
              {nextOpenMatches.map((match) => (
                <tr key={match.id} className="border-b border-slate-100">
                  <td className="py-3">
                    <TeamName
                      name={match.homeTeam?.name}
                      flagUrl={match.homeTeam?.flagUrl}
                      fallback={match.homeSeed}
                    />{" "}
                    vs{" "}
                    <TeamName
                      name={match.awayTeam?.name}
                      flagUrl={match.awayTeam?.flagUrl}
                      fallback={match.awaySeed}
                    />
                  </td>
                  <td className="py-3">{match.groupLetter ?? "-"}</td>
                  <td className="py-3">{formatDateTime(match.startsAt)}</td>
                </tr>
              ))}
              {nextOpenMatches.length === 0 ? (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={3}>
                    Por ahora no hay partidos de eliminatoria disponibles para pronosticar.
                    Puedes ir a pronósticos para elegir 1º y 2º lugar de cada grupo.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Top 10 de la tabla</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2">Lugar</th>
                <th className="py-2">Nombre</th>
                <th className="py-2">Total</th>
                <th className="py-2">Grupos</th>
                <th className="py-2">Partidos</th>
                <th className="py-2">Torneo</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(0, 10).map((row) => (
                <tr key={row.userId} className="border-b border-slate-100">
                  <td className="py-3">{row.rank}</td>
                  <td className="py-3 font-medium">{row.name}</td>
                  <td className="py-3">{row.totalPoints}</td>
                  <td className="py-3">{row.groupPredictionPoints}</td>
                  <td className="py-3">{row.matchPredictionPoints}</td>
                  <td className="py-3">{row.tournamentPredictionPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
