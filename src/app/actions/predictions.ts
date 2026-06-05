"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { validatePredictionInput } from "@/lib/predictionValidation";
import { isKnockoutStage } from "@/lib/stage";

function readNumber(formData: FormData, name: string) {
  const rawValue = String(formData.get(name) ?? "").trim();
  if (!rawValue) return NaN;
  const value = Number(rawValue);
  return Number.isNaN(value) ? NaN : value;
}

function readOptionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function savePredictionAction(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId") ?? "");
  const predictedHomeScore = readNumber(formData, "predictedHomeScore");
  const predictedAwayScore = readNumber(formData, "predictedAwayScore");
  const predictedWinnerTeamId = readOptionalText(
    formData,
    "predictedWinnerTeamId"
  );

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    redirect("/predictions?error=No encontré ese partido.");
  }

  if (match.stage === "GROUP") {
    redirect("/predictions?error=En fase de grupos solo se pronostica 1º y 2º lugar de cada grupo.");
  }

  if (
    isKnockoutStage(match.stage) &&
    (!match.homeTeamId || !match.awayTeamId)
  ) {
    redirect("/predictions?error=Este partido todavía no tiene equipos definidos.");
  }

  const validation = validatePredictionInput(match, {
    predictedHomeScore,
    predictedAwayScore,
    predictedWinnerTeamId
  });

  if (!validation.ok) {
    redirect(`/predictions?error=${encodeURIComponent(validation.errors[0])}`);
  }

  await prisma.prediction.upsert({
    where: {
      userId_matchId: {
        userId: user.id,
        matchId
      }
    },
    update: {
      predictedHomeScore,
      predictedAwayScore,
      predictedWinnerTeamId
    },
    create: {
      userId: user.id,
      matchId,
      predictedHomeScore,
      predictedAwayScore,
      predictedWinnerTeamId
    }
  });

  revalidatePath("/predictions");
  revalidatePath("/dashboard");
  redirect("/predictions?notice=Pronóstico guardado.");
}

export async function saveGroupPredictionsAction(formData: FormData) {
  const user = await requireUser();
  const requestedGroup = readOptionalText(formData, "groupLetter")?.toUpperCase();
  const groups = requestedGroup ? [requestedGroup] : "ABCDEFGHIJKL".split("");
  let savedGroups = 0;

  for (const groupLetter of groups) {
    const firstTeamId = readOptionalText(formData, `${groupLetter}-firstTeamId`);
    const secondTeamId = readOptionalText(formData, `${groupLetter}-secondTeamId`);

    const firstMatch = await prisma.match.findFirst({
      where: { stage: "GROUP", groupLetter },
      orderBy: { startsAt: "asc" }
    });

    if (firstMatch) {
      const lockTime = new Date(firstMatch.startsAt.getTime() - 5 * 60 * 1000);
      if (new Date() >= lockTime) {
        redirect(`/predictions?error=El grupo ${groupLetter} ya está cerrado.`);
      }
    }

    if (!firstTeamId && !secondTeamId) {
      continue;
    }

    if (!firstTeamId || !secondTeamId) {
      redirect(`/predictions?error=Elige 1º y 2º lugar para el grupo ${groupLetter}.`);
    }

    if (firstTeamId === secondTeamId) {
      redirect(`/predictions?error=En el grupo ${groupLetter}, 1º y 2º no pueden ser el mismo equipo.`);
    }

    const validTeams = await prisma.team.count({
      where: {
        groupLetter,
        id: { in: [firstTeamId, secondTeamId] }
      }
    });

    if (validTeams !== 2) {
      redirect(`/predictions?error=Los equipos del grupo ${groupLetter} no son válidos.`);
    }

    await prisma.groupPrediction.upsert({
      where: {
        userId_groupLetter: {
          userId: user.id,
          groupLetter
        }
      },
      update: {
        firstTeamId,
        secondTeamId
      },
      create: {
        userId: user.id,
        groupLetter,
        firstTeamId,
        secondTeamId
      }
    });
    savedGroups += 1;
  }

  if (savedGroups === 0) {
    redirect("/predictions?error=Elige 1º y 2º lugar de al menos un grupo.");
  }

  revalidatePath("/predictions");
  revalidatePath("/dashboard");
  redirect(
    `/predictions?notice=${encodeURIComponent(
      requestedGroup
        ? `Grupo ${requestedGroup} pronosticado.`
        : "Pronóstico de grupos guardado."
    )}`
  );
}

export async function saveTournamentPredictionAction(formData: FormData) {
  const user = await requireUser();
  const championTeamId = readOptionalText(formData, "championTeamId");
  const runnerUpTeamId = readOptionalText(formData, "runnerUpTeamId");

  const tournamentLockMatch =
    (await prisma.match.findFirst({
      where: { stage: "ROUND_OF_16" },
      orderBy: { startsAt: "asc" }
    })) ??
    (await prisma.match.findFirst({
      orderBy: { startsAt: "asc" }
    }));

  if (tournamentLockMatch) {
    if (new Date() >= tournamentLockMatch.startsAt) {
      redirect("/predictions?error=El pronóstico del torneo ya está cerrado.");
    }
  }

  await prisma.tournamentPrediction.upsert({
    where: { userId: user.id },
    update: {
      championTeamId,
      runnerUpTeamId,
      topScorerName: null
    },
    create: {
      userId: user.id,
      championTeamId,
      runnerUpTeamId,
      topScorerName: null
    }
  });

  revalidatePath("/predictions");
  revalidatePath("/dashboard");
  redirect("/predictions?notice=Pronóstico del torneo guardado.");
}
