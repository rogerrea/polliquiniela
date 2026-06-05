import {
  recalculateScoresAction,
  saveGroupActualAction,
  saveMatchAction,
  savePrizeConfigAction,
  saveResultAction,
  saveTeamAction,
  saveTournamentActualAction
} from "@/app/actions/admin";
import { Notice } from "@/components/Notice";
import { TeamName } from "@/components/TeamName";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { stageLabels } from "@/lib/stage";

export const dynamic = "force-dynamic";

const stages = [
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL"
];

const statuses = ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"];

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programado",
  LIVE: "En vivo",
  FINISHED: "Terminado",
  CANCELLED: "Cancelado"
};

function teamLabel(team?: { name: string } | null, seed?: string | null) {
  return team?.name ?? seed ?? "Por definir";
}

type AdminPageProps = {
  searchParams: {
    error?: string;
    notice?: string;
  };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdmin();

  const [teams, matches, actual, groupActuals, prizeConfig] = await Promise.all([
    prisma.team.findMany({
      orderBy: [{ groupLetter: "asc" }, { name: "asc" }]
    }),
    prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        winnerTeam: true
      },
      orderBy: [{ startsAt: "asc" }]
    }),
    prisma.tournamentActual.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" }
    }),
    prisma.groupActual.findMany(),
    prisma.prizeConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" }
    })
  ]);
  const groups = "ABCDEFGHIJKL".split("");
  const teamsByGroup = groups.reduce<Record<string, typeof teams>>(
    (result, groupLetter) => {
      result[groupLetter] = teams.filter(
        (team) => team.groupLetter === groupLetter
      );
      return result;
    },
    {}
  );
  const actualByGroup = new Map(
    groupActuals.map((groupActual) => [groupActual.groupLetter, groupActual])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Edita equipos, partidos, resultados y recalcula puntos.
        </p>
      </div>

      <Notice error={searchParams.error} notice={searchParams.notice} />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Premios</h2>
        <p className="mt-1 text-sm text-slate-600">
          Estos montos aparecen flotando abajo para todos los usuarios.
        </p>
        <form action={savePrizeConfigAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">1er lugar</span>
            <input
              name="firstPlacePrize"
              type="number"
              min={0}
              defaultValue={prizeConfig.firstPlacePrize ?? ""}
              placeholder="Ej. 5000"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Segundo lugar</span>
            <input
              name="secondPlacePrize"
              type="number"
              min={0}
              defaultValue={prizeConfig.secondPlacePrize ?? ""}
              placeholder="Ej. 2500"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700">
              Guardar premios
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recalcular puntos</h2>
            <p className="text-sm text-slate-600">
              Úsalo después de capturar resultados o datos reales del torneo.
            </p>
          </div>
          <form action={recalculateScoresAction}>
            <button className="rounded-full bg-slate-950 px-5 py-2 font-semibold text-white hover:bg-slate-800">
              Recalcular
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Resultados reales del torneo</h2>
        <form action={saveTournamentActualAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Campeón real</span>
            <select
              name="championTeamId"
              defaultValue={actual.championTeamId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">No definido</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Subcampeón real</span>
            <select
              name="runnerUpTeamId"
              defaultValue={actual.runnerUpTeamId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">No definido</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700">
              Guardar reales
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Resultados reales de grupos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Captura el 1º y 2º lugar real de cada grupo. Esto recalcula los puntos de grupos.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {groups.map((groupLetter) => {
            const groupTeams = teamsByGroup[groupLetter] ?? [];
            const groupActual = actualByGroup.get(groupLetter);

            return (
              <form
                key={groupLetter}
                action={saveGroupActualAction}
                className="rounded-md border border-slate-200 p-3"
              >
                <input type="hidden" name="groupLetter" value={groupLetter} />
                <h3 className="font-semibold">Grupo {groupLetter}</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">1º real</span>
                    <select
                      name="firstTeamId"
                      defaultValue={groupActual?.firstTeamId ?? ""}
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
                    >
                      <option value="">No definido</option>
                      {groupTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">2º real</span>
                    <select
                      name="secondTeamId"
                      defaultValue={groupActual?.secondTeamId ?? ""}
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
                    >
                      <option value="">No definido</option>
                      {groupTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button className="mt-3 w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700">
                  Guardar grupo {groupLetter}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Agregar equipo</h2>
        <form action={saveTeamAction} className="mt-4 grid gap-3 md:grid-cols-5">
          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Nombre del equipo</span>
            <input name="name" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Código FIFA</span>
            <input name="fifaCode" required maxLength={6} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Grupo</span>
            <input name="groupLetter" maxLength={1} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">URL de bandera</span>
            <input name="flagUrl" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button className="rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700 md:col-span-5">
            Agregar equipo
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Equipos</h2>
        <div className="mt-4 grid gap-3">
          {teams.map((team) => (
            <form key={team.id} action={saveTeamAction} className="grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-5">
              <input type="hidden" name="id" value={team.id} />
              <input name="name" defaultValue={team.name} className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2" />
              <input name="fifaCode" defaultValue={team.fifaCode} className="rounded-md border border-slate-300 px-3 py-2" />
              <input name="groupLetter" defaultValue={team.groupLetter ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
              <input name="flagUrl" defaultValue={team.flagUrl ?? ""} placeholder="URL de bandera" className="rounded-md border border-slate-300 px-3 py-2" />
              <button className="rounded-full bg-slate-950 px-5 py-2 font-semibold text-white hover:bg-slate-800 md:col-span-5">
                Guardar equipo
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Agregar partido</h2>
        <form action={saveMatchAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Número de partido</span>
            <input name="fifaMatchNumber" type="number" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Fase</span>
            <select name="stage" defaultValue="GROUP" className="w-full rounded-md border border-slate-300 px-3 py-2">
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabels[stage]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Grupo</span>
            <input name="groupLetter" maxLength={1} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Fecha y hora</span>
            <input name="startsAt" type="datetime-local" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Equipo local</span>
            <select name="homeTeamId" className="w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Por definir</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Equipo visitante</span>
            <select name="awayTeamId" className="w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Por definir</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Estado</span>
            <select name="status" defaultValue="SCHEDULED" className="w-full rounded-md border border-slate-300 px-3 py-2">
              {statuses.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Texto local</span>
            <input name="homeSeed" placeholder="Ej. 1A" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Texto visitante</span>
            <input name="awaySeed" placeholder="Ej. 2B" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Sede</span>
            <input name="venue" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Link verificación</span>
            <input name="verifyUrl" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700">
              Agregar partido
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Partidos y resultados</h2>
        <div className="mt-4 space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="space-y-3 rounded-md border border-slate-200 p-3">
              <div>
                <p className="font-semibold">
                  {match.fifaMatchNumber ? `#${match.fifaMatchNumber} ` : ""}
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
                </p>
                <p className="text-sm text-slate-600">
                  {stageLabels[match.stage]} {match.groupLetter ? `· Grupo ${match.groupLetter}` : ""} · {formatDateTime(match.startsAt)} · {statusLabels[match.status] ?? match.status}
                  {match.venue ? ` · ${match.venue}` : ""}
                </p>
                {match.verifyUrl ? (
                  <a href={match.verifyUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-violet-700 underline">
                    Verificar en FIFA
                  </a>
                ) : null}
              </div>

              <form action={saveMatchAction} className="grid gap-2 md:grid-cols-4">
                <input type="hidden" name="id" value={match.id} />
                <input name="fifaMatchNumber" type="number" defaultValue={match.fifaMatchNumber ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
                <select name="stage" defaultValue={match.stage} className="rounded-md border border-slate-300 px-3 py-2">
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>{stageLabels[stage]}</option>
                  ))}
                </select>
                <input name="groupLetter" defaultValue={match.groupLetter ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
                <input name="startsAt" type="datetime-local" defaultValue={toDateTimeLocalValue(match.startsAt)} className="rounded-md border border-slate-300 px-3 py-2" />
                <select name="homeTeamId" defaultValue={match.homeTeamId ?? ""} className="rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Por definir</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <select name="awayTeamId" defaultValue={match.awayTeamId ?? ""} className="rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Por definir</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <select name="status" defaultValue={match.status} className="rounded-md border border-slate-300 px-3 py-2">
                  {statuses.map((status) => (
                    <option key={status} value={status}>{statusLabels[status]}</option>
                  ))}
                </select>
                <input name="homeSeed" defaultValue={match.homeSeed ?? ""} placeholder="Texto local" className="rounded-md border border-slate-300 px-3 py-2" />
                <input name="awaySeed" defaultValue={match.awaySeed ?? ""} placeholder="Texto visitante" className="rounded-md border border-slate-300 px-3 py-2" />
                <input name="venue" defaultValue={match.venue ?? ""} placeholder="Sede" className="rounded-md border border-slate-300 px-3 py-2" />
                <input name="verifyUrl" defaultValue={match.verifyUrl ?? ""} placeholder="Link verificación" className="rounded-md border border-slate-300 px-3 py-2" />
                <button className="rounded-full bg-slate-950 px-5 py-2 font-semibold text-white hover:bg-slate-800">
                  Guardar partido
                </button>
              </form>

              <form action={saveResultAction} className="grid gap-2 md:grid-cols-4">
                <input type="hidden" name="id" value={match.id} />
                <input name="homeScore" type="number" min={0} max={20} defaultValue={match.homeScore ?? ""} placeholder="Goles local" className="rounded-md border border-slate-300 px-3 py-2" />
                <input name="awayScore" type="number" min={0} max={20} defaultValue={match.awayScore ?? ""} placeholder="Goles visitante" className="rounded-md border border-slate-300 px-3 py-2" />
                <select name="winnerTeamId" defaultValue={match.winnerTeamId ?? ""} className="rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Sin ganador o empate</option>
                  {match.homeTeam ? (
                    <option value={match.homeTeam.id}>{match.homeTeam.name}</option>
                  ) : null}
                  {match.awayTeam ? (
                    <option value={match.awayTeam.id}>{match.awayTeam.name}</option>
                  ) : null}
                </select>
                <button className="rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700">
                  Guardar resultado y cerrar
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
