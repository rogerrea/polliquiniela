import {
  saveGroupPredictionsAction,
  savePredictionAction,
  saveTournamentPredictionAction
} from "@/app/actions/predictions";
import { Notice } from "@/components/Notice";
import { TeamName } from "@/components/TeamName";
import { requireUser } from "@/lib/auth";
import { formatMexicoCityDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isPredictionLocked } from "@/lib/predictionValidation";
import { isKnockoutStage, stageLabels } from "@/lib/stage";

export const dynamic = "force-dynamic";

type PredictionsPageProps = {
  searchParams: {
    error?: string;
    notice?: string;
  };
};

function lockLabel(locked: boolean, status: string) {
  if (status === "CANCELLED") return "Cancelado";
  if (status === "FINISHED") return "Terminado";
  if (locked) return "Cerrado";
  return "Abierto";
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programado",
  LIVE: "En vivo",
  FINISHED: "Terminado",
  CANCELLED: "Cancelado"
};

const knockoutStageOrder = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL"
];

const hostCountryByCity: Record<string, string> = {
  Atlanta: "Estados Unidos",
  Boston: "Estados Unidos",
  Dallas: "Estados Unidos",
  Guadalajara: "México",
  Houston: "Estados Unidos",
  "Kansas City": "Estados Unidos",
  "Los Angeles": "Estados Unidos",
  "Mexico City": "México",
  Miami: "Estados Unidos",
  Monterrey: "México",
  "New York": "Estados Unidos",
  Philadelphia: "Estados Unidos",
  "San Francisco": "Estados Unidos",
  Seattle: "Estados Unidos",
  Toronto: "Canadá",
  Vancouver: "Canadá"
};

const cityLabels: Record<string, string> = {
  "Mexico City": "Ciudad de México",
  "New York": "Nueva York"
};

function formatVenueLocation(venue?: string | null) {
  if (!venue) return "Sede por definir";

  const city = venue.split(",").pop()?.trim() ?? venue;
  const country = hostCountryByCity[city];
  const cityLabel = cityLabels[city] ?? city;

  return country ? `${cityLabel}, ${country}` : cityLabel;
}

function HelpTooltip({ explanation }: { explanation: string }) {
  return (
    <span className="group relative inline-flex items-center align-middle">
      <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-[10px] font-semibold leading-none text-slate-500">
        ?
      </span>
      <span className="pointer-events-none absolute right-0 top-6 z-20 hidden w-64 rounded-md border border-slate-200 bg-white p-3 text-left text-xs font-normal leading-relaxed text-slate-700 shadow-lg group-hover:block group-focus-within:block">
        {explanation}
      </span>
    </span>
  );
}

export default async function PredictionsPage({ searchParams }: PredictionsPageProps) {
  const user = await requireUser();

  const [matches, teams, tournamentPrediction, groupPredictions] = await Promise.all([
    prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          where: { userId: user.id }
        }
      },
      orderBy: [{ startsAt: "asc" }]
    }),
    prisma.team.findMany({
      orderBy: [{ groupLetter: "asc" }, { name: "asc" }]
    }),
    prisma.tournamentPrediction.findUnique({
      where: { userId: user.id }
    }),
    prisma.groupPrediction.findMany({
      where: { userId: user.id }
    })
  ]);

  const knockoutMatchesByStage = matches
    .filter((match) => isKnockoutStage(match.stage))
    .reduce<Record<string, typeof matches>>(
    (groups, match) => {
      const key = match.stage;
      groups[key] = groups[key] ?? [];
      groups[key].push(match);
      return groups;
    },
    {}
  );

  const tournamentLockMatch =
    matches.find((match) => match.stage === "ROUND_OF_16") ?? matches[0];
  const tournamentDeadline = tournamentLockMatch?.startsAt ?? null;
  const tournamentLocked = tournamentDeadline
    ? new Date() >= tournamentDeadline
    : false;
  const groups = "ABCDEFGHIJKL".split("");
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const championTeam = tournamentPrediction?.championTeamId
    ? teamById.get(tournamentPrediction.championTeamId)
    : null;
  const runnerUpTeam = tournamentPrediction?.runnerUpTeamId
    ? teamById.get(tournamentPrediction.runnerUpTeamId)
    : null;
  const teamsByGroup = groups.reduce<Record<string, typeof teams>>(
    (result, groupLetter) => {
      result[groupLetter] = teams.filter(
        (team) => team.groupLetter === groupLetter
      );
      return result;
    },
    {}
  );
  const predictionsByGroup = new Map(
    groupPredictions.map((prediction) => [prediction.groupLetter, prediction])
  );
  const groupMatchesByGroup = groups.reduce<Record<string, typeof matches>>(
    (result, groupLetter) => {
      result[groupLetter] = matches
        .filter(
          (match) => match.stage === "GROUP" && match.groupLetter === groupLetter
        )
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      return result;
    },
    {}
  );
  const groupDeadlineByGroup = new Map(
    groups.map((groupLetter) => {
      const firstGroupMatch = groupMatchesByGroup[groupLetter]?.[0];

      return [
        groupLetter,
        firstGroupMatch
          ? new Date(firstGroupMatch.startsAt.getTime() - 5 * 60 * 1000)
          : null
      ];
    })
  );
  const groupLockByGroup = new Map(
    groups.map((groupLetter) => {
      const firstGroupMatch = groupMatchesByGroup[groupLetter]?.[0];

      return [
        groupLetter,
        firstGroupMatch ? isPredictionLocked(firstGroupMatch) : false
      ];
    })
  );
  const knockoutSections = knockoutStageOrder
    .map((stage) => [stage, knockoutMatchesByStage[stage] ?? []] as const)
    .filter(([, stageMatches]) => stageMatches.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pronósticos</h1>
        <p className="mt-1 text-sm text-slate-600">
          En fase de grupos eliges 1º y 2º lugar de cada grupo. En eliminatorias pronosticas marcador y ganador cuando el partido ya tenga equipos definidos.
        </p>
      </div>

      <Notice error={searchParams.error} notice={searchParams.notice} />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pronóstico del torneo</h2>
            <p className="text-sm text-slate-600">
              Campeón vale 20 puntos y subcampeón 12. Cierra al iniciar octavos:
              {" "}
              {tournamentDeadline
                ? formatMexicoCityDateTime(tournamentDeadline)
                : "por definir"}
              .
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tournamentLocked ? "bg-slate-200 text-slate-700" : "bg-violet-100 text-violet-700"
          }`}>
            {tournamentLocked ? "Cerrado" : "Abierto"}
          </span>
        </div>

        <form action={saveTournamentPredictionAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-start">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Campeón</span>
            <select
              name="championTeamId"
              defaultValue={tournamentPrediction?.championTeamId ?? ""}
              disabled={tournamentLocked}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Elegir equipo</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <span className="block min-h-5 text-xs text-slate-600">
              {championTeam ? (
                <>
                  Guardado: <TeamName name={championTeam.name} flagUrl={championTeam.flagUrl} />
                </>
              ) : "\u00a0"}
            </span>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Subcampeón</span>
            <select
              name="runnerUpTeamId"
              defaultValue={tournamentPrediction?.runnerUpTeamId ?? ""}
              disabled={tournamentLocked}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Elegir equipo</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <span className="block min-h-5 text-xs text-slate-600">
              {runnerUpTeam ? (
                <>
                  Guardado: <TeamName name={runnerUpTeam.name} flagUrl={runnerUpTeam.flagUrl} />
                </>
              ) : "\u00a0"}
            </span>
          </label>
          <div className="flex items-start lg:min-w-[320px] lg:pt-6">
            <button
              disabled={tournamentLocked}
              className="h-[44px] w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700 disabled:bg-slate-300"
            >
              Guardar pronóstico del torneo
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pronóstico de fase de grupos</h2>
            <p className="text-sm text-slate-600">
              Elige quién queda 1º y 2º en cada grupo. Los horarios están en hora centro de México.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {groups.map((groupLetter) => {
            const groupPrediction = predictionsByGroup.get(groupLetter);
            const groupLocked = groupLockByGroup.get(groupLetter) ?? false;
            const groupTeams = teamsByGroup[groupLetter] ?? [];
            const groupMatches = groupMatchesByGroup[groupLetter] ?? [];
            const deadline = groupDeadlineByGroup.get(groupLetter);
            const firstPick = groupPrediction?.firstTeamId
              ? teamById.get(groupPrediction.firstTeamId)
              : null;
            const secondPick = groupPrediction?.secondTeamId
              ? teamById.get(groupPrediction.secondTeamId)
              : null;
            const isGroupPredicted = Boolean(firstPick && secondPick);

            return (
              <form
                key={groupLetter}
                action={saveGroupPredictionsAction}
                className="flex h-full flex-col rounded-md border border-slate-200 p-3"
              >
                <input type="hidden" name="groupLetter" value={groupLetter} />
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Grupo {groupLetter}</h3>
                    <p className="text-xs text-slate-500">
                      Cierra: {deadline ? formatMexicoCityDateTime(deadline) : "Por definir"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Puntos: {groupPrediction?.points ?? 0}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      groupLocked ? "bg-slate-200 text-slate-700" : "bg-violet-100 text-violet-700"
                    }`}>
                      {groupLocked ? "Cerrado" : "Abierto"}
                    </span>
                    {isGroupPredicted ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Pronosticado
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                  <p className="mb-2 text-xs font-semibold text-slate-600">Partidos del grupo</p>
                  <div className="grid gap-1">
                    {groupMatches.map((match) => (
                      <div key={match.id} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600">
                        <div className="font-medium text-slate-900">
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
                        </div>
                        <div className="mt-0.5 text-slate-500">
                          {formatMexicoCityDateTime(match.startsAt)} · {formatVenueLocation(match.venue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium">1º lugar</span>
                      <select
                        name={`${groupLetter}-firstTeamId`}
                        defaultValue={groupPrediction?.firstTeamId ?? ""}
                        disabled={groupLocked}
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                      >
                        <option value="">Elegir equipo</option>
                        {groupTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      <span className="block min-h-5 text-xs text-slate-600">
                        {firstPick ? (
                          <>
                            Guardado: <TeamName name={firstPick.name} flagUrl={firstPick.flagUrl} />
                          </>
                        ) : "\u00a0"}
                      </span>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium">2º lugar</span>
                      <select
                        name={`${groupLetter}-secondTeamId`}
                        defaultValue={groupPrediction?.secondTeamId ?? ""}
                        disabled={groupLocked}
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                      >
                        <option value="">Elegir equipo</option>
                        {groupTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      <span className="block min-h-5 text-xs text-slate-600">
                        {secondPick ? (
                          <>
                            Guardado: <TeamName name={secondPick.name} flagUrl={secondPick.flagUrl} />
                          </>
                        ) : "\u00a0"}
                      </span>
                    </label>
                  </div>
                  <button
                    disabled={groupLocked}
                    className="mt-3 h-[44px] w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700 disabled:bg-slate-300"
                  >
                    Guardar grupo {groupLetter}
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </section>

      {knockoutSections.map(([stage, groupMatches]) => {
        const title = stageLabels[stage] ?? stage;

        return (
          <details key={stage} className="rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer select-none text-lg font-semibold">
              {title} ({groupMatches.length})
            </summary>
            <div className="mt-4 space-y-4">
              {groupMatches.map((match) => {
                const prediction = match.predictions[0];
                const locked = isPredictionLocked(match);
                const closed = locked || match.status === "CANCELLED" || match.status === "FINISHED";
                const isKnockout = isKnockoutStage(match.stage);
                const hasTeamsDefined = Boolean(match.homeTeamId && match.awayTeamId);
                const canPredictMatch = isKnockout && hasTeamsDefined;
                const unavailable = match.stage === "GROUP" || (isKnockout && !hasTeamsDefined);
                const unavailableHelp =
                  "Estará disponible cuando el Admin capture los equipos clasificados para este partido.";
                const statusText = unavailable
                  ? "Aún no disponible"
                  : lockLabel(locked, match.status);

                return (
                  <div
                    key={match.id}
                    className="rounded-md border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
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
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${
                            unavailable || closed ? "bg-slate-200 text-slate-700" : "bg-violet-100 text-violet-700"
                          }`}>
                            {statusText}
                            {unavailable ? <HelpTooltip explanation={unavailableHelp} /> : null}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Hora centro de México: {formatMexicoCityDateTime(match.startsAt)} · Estado: {statusLabels[match.status] ?? match.status}
                          {match.status === "FINISHED"
                            ? ` · Marcador final: ${match.homeScore ?? "-"}-${match.awayScore ?? "-"}`
                            : ""}
                        </p>
                        {match.venue ? (
                          <p className="text-sm text-slate-600">
                            Ciudad y país: {formatVenueLocation(match.venue)} · Estadio: {match.venue.split(",")[0]}
                          </p>
                        ) : null}
                        {match.verifyUrl ? (
                          <a
                            href={match.verifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-violet-700 underline"
                          >
                            Verificar fecha y equipos en FIFA
                          </a>
                        ) : null}
                      </div>
                      {canPredictMatch ? (
                        <form
                          action={savePredictionAction}
                          className="grid gap-3 sm:grid-cols-[90px_90px_180px_90px] sm:items-end"
                        >
                          <input type="hidden" name="matchId" value={match.id} />
                          <label className="block space-y-1">
                            <span className="text-xs font-medium">Local</span>
                            <input
                              name="predictedHomeScore"
                              type="number"
                              min={0}
                              max={20}
                              required
                              defaultValue={prediction?.predictedHomeScore ?? ""}
                              disabled={closed}
                              className="w-full rounded-md border border-slate-300 px-3 py-2"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-medium">Visitante</span>
                            <input
                              name="predictedAwayScore"
                              type="number"
                              min={0}
                              max={20}
                              required
                              defaultValue={prediction?.predictedAwayScore ?? ""}
                              disabled={closed}
                              className="w-full rounded-md border border-slate-300 px-3 py-2"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-medium">Ganador</span>
                            <select
                              name="predictedWinnerTeamId"
                              defaultValue={prediction?.predictedWinnerTeamId ?? ""}
                              disabled={closed}
                              className="w-full rounded-md border border-slate-300 px-3 py-2"
                            >
                              <option value="">Elegir ganador</option>
                              {match.homeTeam ? (
                                <option value={match.homeTeam.id}>{match.homeTeam.name}</option>
                              ) : null}
                              {match.awayTeam ? (
                                <option value={match.awayTeam.id}>{match.awayTeam.name}</option>
                              ) : null}
                            </select>
                          </label>
                          <div className="space-y-1">
                            <span className="block text-xs font-medium">Puntos</span>
                            {match.status === "FINISHED" ? (
                              <div className="rounded-md bg-slate-100 px-3 py-2 text-center font-semibold">
                                {prediction?.points ?? 0}
                              </div>
                            ) : (
                              <button
                                disabled={closed}
                                className="w-full rounded-full bg-violet-600 px-5 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] hover:bg-violet-700 disabled:bg-slate-300"
                              >
                                Guardar
                              </button>
                            )}
                          </div>
                        </form>
                      ) : (
                        <div className="inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 lg:min-w-[170px]">
                          <span>Aún no disponible</span>
                          <HelpTooltip explanation={unavailableHelp} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
