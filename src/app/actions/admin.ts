"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateScores } from "@/lib/recalculateScores";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  const value = text(formData, name);
  return value.length > 0 ? value : null;
}

function optionalNumber(formData: FormData, name: string) {
  const value = text(formData, name);
  if (!value) return null;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function optionalPrizeAmount(formData: FormData, name: string) {
  const value = optionalNumber(formData, name);
  if (value === null) return null;
  return Math.max(0, Math.round(value));
}

export async function saveTeamAction(formData: FormData) {
  await requireAdmin();

  const id = optionalText(formData, "id");
  const name = text(formData, "name");
  const fifaCode = text(formData, "fifaCode").toUpperCase();
  const groupLetter = optionalText(formData, "groupLetter")?.toUpperCase() ?? null;
  const flagUrl = optionalText(formData, "flagUrl");

  if (!name || !fifaCode) {
    redirect("/admin?error=El nombre del equipo y el código FIFA son obligatorios.");
  }

  if (id) {
    await prisma.team.update({
      where: { id },
      data: { name, fifaCode, groupLetter, flagUrl }
    });
  } else {
    await prisma.team.create({
      data: { name, fifaCode, groupLetter, flagUrl }
    });
  }

  revalidatePath("/admin");
  redirect("/admin?notice=Equipo guardado.");
}

export async function saveMatchAction(formData: FormData) {
  await requireAdmin();

  const id = optionalText(formData, "id");
  const startsAtValue = text(formData, "startsAt");
  const startsAt = new Date(startsAtValue);

  if (Number.isNaN(startsAt.getTime())) {
    redirect("/admin?error=Escribe una fecha válida para el partido.");
  }

  const data = {
    fifaMatchNumber: optionalNumber(formData, "fifaMatchNumber"),
    stage: text(formData, "stage"),
    groupLetter: optionalText(formData, "groupLetter")?.toUpperCase() ?? null,
    homeTeamId: optionalText(formData, "homeTeamId"),
    awayTeamId: optionalText(formData, "awayTeamId"),
    homeSeed: optionalText(formData, "homeSeed"),
    awaySeed: optionalText(formData, "awaySeed"),
    venue: optionalText(formData, "venue"),
    verifyUrl: optionalText(formData, "verifyUrl"),
    startsAt,
    status: text(formData, "status")
  };

  if (id) {
    await prisma.match.update({
      where: { id },
      data
    });
  } else {
    await prisma.match.create({ data });
  }

  revalidatePath("/admin");
  revalidatePath("/predictions");
  redirect("/admin?notice=Partido guardado.");
}

export async function saveResultAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  const homeScore = optionalNumber(formData, "homeScore");
  const awayScore = optionalNumber(formData, "awayScore");
  const winnerTeamId = optionalText(formData, "winnerTeamId");

  if (!id || homeScore === null || awayScore === null) {
    redirect("/admin?error=El resultado necesita partido, goles local y goles visitante.");
  }

  await prisma.match.update({
    where: { id },
    data: {
      homeScore,
      awayScore,
      winnerTeamId,
      status: "FINISHED"
    }
  });

  await recalculateScores();

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/predictions");
  redirect("/admin?notice=Resultado guardado y puntos recalculados.");
}

export async function saveTournamentActualAction(formData: FormData) {
  await requireAdmin();

  await prisma.tournamentActual.upsert({
    where: { id: "default" },
    update: {
      championTeamId: optionalText(formData, "championTeamId"),
      runnerUpTeamId: optionalText(formData, "runnerUpTeamId"),
      topScorerName: null
    },
    create: {
      id: "default",
      championTeamId: optionalText(formData, "championTeamId"),
      runnerUpTeamId: optionalText(formData, "runnerUpTeamId"),
      topScorerName: null
    }
  });

  await recalculateScores();

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  redirect("/admin?notice=Resultados reales del torneo guardados y puntos recalculados.");
}

export async function saveGroupActualAction(formData: FormData) {
  await requireAdmin();

  const groupLetter = text(formData, "groupLetter").toUpperCase();
  const firstTeamId = optionalText(formData, "firstTeamId");
  const secondTeamId = optionalText(formData, "secondTeamId");

  if (!groupLetter) {
    redirect("/admin?error=El grupo es obligatorio.");
  }

  if (firstTeamId && secondTeamId && firstTeamId === secondTeamId) {
    redirect("/admin?error=El 1º y 2º lugar no pueden ser el mismo equipo.");
  }

  const selectedTeamIds = [firstTeamId, secondTeamId].filter(Boolean) as string[];
  if (selectedTeamIds.length > 0) {
    const validTeams = await prisma.team.count({
      where: {
        groupLetter,
        id: { in: selectedTeamIds }
      }
    });

    if (validTeams !== selectedTeamIds.length) {
      redirect("/admin?error=Los equipos reales deben pertenecer al grupo seleccionado.");
    }
  }

  await prisma.groupActual.upsert({
    where: { groupLetter },
    update: {
      firstTeamId,
      secondTeamId
    },
    create: {
      groupLetter,
      firstTeamId,
      secondTeamId
    }
  });

  await recalculateScores();

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  redirect("/admin?notice=Resultado real del grupo guardado y puntos recalculados.");
}

export async function savePrizeConfigAction(formData: FormData) {
  await requireAdmin();

  await prisma.prizeConfig.upsert({
    where: { id: "default" },
    update: {
      firstPlacePrize: optionalPrizeAmount(formData, "firstPlacePrize"),
      secondPlacePrize: optionalPrizeAmount(formData, "secondPlacePrize")
    },
    create: {
      id: "default",
      firstPlacePrize: optionalPrizeAmount(formData, "firstPlacePrize"),
      secondPlacePrize: optionalPrizeAmount(formData, "secondPlacePrize")
    }
  });

  revalidatePath("/admin");
  revalidatePath("/", "layout");
  redirect("/admin?notice=Premios guardados.");
}

export async function recalculateScoresAction() {
  await requireAdmin();
  await recalculateScores();

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/predictions");
  redirect("/admin?notice=Puntos recalculados.");
}
