import { requireUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

function TooltipHeader({
  children,
  explanation
}: {
  children: React.ReactNode;
  explanation: string;
}) {
  return (
    <span className="group relative inline-flex items-center gap-1.5">
      <span>{children}</span>
      <span
        aria-label={explanation}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-500"
      >
        ?
      </span>
      <span className="pointer-events-none absolute left-0 top-7 z-20 hidden w-72 rounded-md border border-slate-200 bg-white p-3 text-left text-xs font-normal leading-relaxed text-slate-700 shadow-lg group-hover:block group-focus-within:block">
        {explanation}
      </span>
    </span>
  );
}

export default async function LeaderboardPage() {
  await requireUser();
  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Tabla general</h1>
        <p className="mt-1 text-sm text-slate-600">
          El orden usa puntos totales, marcadores exactos, resultados correctos,
          puntos de eliminatorias y fecha de registro.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Cómo se ganan puntos</h2>
        <div className="mt-3 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
          <div className="space-y-2">
            <p className="font-semibold text-slate-950">Fase de grupos</p>
          <p>En fase de grupos eliges 1º y 2º lugar de cada grupo.</p>
          <p>Los partidos de grupos sí aparecen en la pantalla, pero no aceptan marcador.</p>
          <p>1º correcto: 5 puntos. 2º correcto: 5 puntos.</p>
          <p>Si aciertas que un equipo quedó en top 2, pero invertido, suma 2 puntos.</p>
          <p>Máximo por grupo: 10 puntos.</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-slate-950">Eliminatorias y torneo</p>
            <p>En eliminatorias pronosticas marcador y ganador cuando los equipos ya estén definidos.</p>
            <p>Marcador exacto: 5 puntos.</p>
            <p>Resultado correcto y diferencia correcta: 4 puntos.</p>
            <p>Resultado correcto: 3 puntos.</p>
            <p>Si aciertas el ganador, aseguras mínimo 4 puntos.</p>
            <p>Máximo en eliminatorias: 6 puntos por partido.</p>
            <p>Campeón correcto: 20 puntos.</p>
            <p>Subcampeón correcto: 12 puntos.</p>
          </div>
        </div>
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Ejemplo</p>
          <p className="mt-1">
            En grupos, si eliges México 1º y Sudáfrica 2º, y así termina el
            grupo, ganas 10 puntos. Si terminan invertidos, ganas 4 puntos.
          </p>
          <p className="mt-1">
            En eliminatorias, si pronosticas México 2-1 Sudáfrica y termina
            México 2-1 Sudáfrica, ganas 5 puntos por marcador exacto.
          </p>
          <p className="mt-1">
            Si además aciertas campeón y subcampeón del torneo, sumas 32 puntos
            extra.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2">
                  <TooltipHeader explanation="Posición en la tabla. Primero ordena por puntos totales; si hay empate usa marcadores exactos, resultados correctos, puntos de eliminatorias y fecha de registro.">
                    Lugar
                  </TooltipHeader>
                </th>
                <th className="py-2">Usuario</th>
                <th className="py-2">
                  <TooltipHeader explanation="Suma de puntos de grupos, eliminatorias y torneo. Es el número principal para ordenar la quiniela.">
                    Puntos totales
                  </TooltipHeader>
                </th>
                <th className="py-2">
                  <TooltipHeader explanation="Puntos por acertar 1º y 2º de cada grupo. Puesto exacto vale 5; equipo en top 2 pero invertido vale 2. Máximo 10 por grupo.">
                    Puntos grupos
                  </TooltipHeader>
                </th>
                <th className="py-2">
                  <TooltipHeader explanation="Puntos ganados pronosticando marcadores de eliminatorias. Marcador exacto vale 5; resultado correcto con diferencia correcta vale 4; resultado correcto vale 3; si aciertas el ganador aseguras mínimo 4.">
                    Puntos partidos
                  </TooltipHeader>
                </th>
                <th className="py-2">
                  <TooltipHeader explanation="Puntos por pronóstico del torneo: campeón correcto vale 20 y subcampeón correcto vale 12.">
                    Puntos torneo
                  </TooltipHeader>
                </th>
                <th className="py-2">
                  <TooltipHeader explanation="Cantidad de partidos donde acertaste el marcador exacto, por ejemplo 2-1.">
                    Marcadores exactos
                  </TooltipHeader>
                </th>
                <th className="py-2">
                  <TooltipHeader explanation="Cantidad de partidos donde acertaste el resultado: gana local, gana visitante o empate.">
                    Resultados correctos
                  </TooltipHeader>
                </th>
                <th className="py-2">
                  <TooltipHeader explanation="Puntos ganados solo en partidos de eliminación directa. Si aciertas el ganador, ese partido asegura mínimo 4 puntos y máximo 6.">
                    Puntos eliminatorias
                  </TooltipHeader>
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={row.userId} className="border-b border-slate-100">
                  <td className="py-3">{row.rank}</td>
                  <td className="py-3 font-medium">{row.name}</td>
                  <td className="py-3 font-semibold">{row.totalPoints}</td>
                  <td className="py-3">{row.groupPredictionPoints}</td>
                  <td className="py-3">{row.matchPredictionPoints}</td>
                  <td className="py-3">{row.tournamentPredictionPoints}</td>
                  <td className="py-3">{row.exactScoresCount}</td>
                  <td className="py-3">{row.correctResultsCount}</td>
                  <td className="py-3">{row.knockoutPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
