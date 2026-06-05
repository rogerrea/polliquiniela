import { PrismaClient } from "@prisma/client";
import { recalculateScores } from "../src/lib/recalculateScores";

const prisma = new PrismaClient();
const scenario = process.argv[2] ?? "mid";

const groupActualCodes: Record<string, [string, string]> = {
  A: ["MEX", "CZE"],
  B: ["CAN", "SUI"],
  C: ["BRA", "MAR"],
  D: ["USA", "TUR"],
  E: ["GER", "ECU"],
  F: ["NED", "JPN"],
  G: ["BEL", "EGY"],
  H: ["ESP", "URU"],
  I: ["FRA", "SEN"],
  J: ["ARG", "AUT"],
  K: ["POR", "COL"],
  L: ["ENG", "CRO"]
};

const demoUsers = [
  {
    email: "ana@grupalia.com",
    name: "Ana Demo",
    champion: "MEX",
    runnerUp: "BRA",
    pickShift: 0
  },
  {
    email: "bruno@grupalia.com",
    name: "Bruno Demo",
    champion: "ARG",
    runnerUp: "FRA",
    pickShift: 1
  },
  {
    email: "carla@grupalia.com",
    name: "Carla Demo",
    champion: "ESP",
    runnerUp: "MEX",
    pickShift: 2
  },
  {
    email: "diego@grupalia.com",
    name: "Diego Demo",
    champion: "BRA",
    runnerUp: "ENG",
    pickShift: 3
  }
];

function assertSafeDatabase() {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl.startsWith("file:") && process.env.ALLOW_DEV_SCENARIO !== "true") {
    throw new Error(
      "This script is for local/dev only. Set ALLOW_DEV_SCENARIO=true if you really intend to run it elsewhere."
    );
  }
}

async function teamByCode() {
  const teams = await prisma.team.findMany();
  return new Map(teams.map((team) => [team.fifaCode, team]));
}

async function upsertDemoUsers(teams: Awaited<ReturnType<typeof teamByCode>>) {
  const users = [];

  for (const demoUser of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: { name: demoUser.name },
      create: {
        email: demoUser.email,
        name: demoUser.name,
        passwordHash: "email-only-login"
      }
    });

    users.push({ ...demoUser, id: user.id });

    await prisma.tournamentPrediction.upsert({
      where: { userId: user.id },
      update: {
        championTeamId: teams.get(demoUser.champion)?.id,
        runnerUpTeamId: teams.get(demoUser.runnerUp)?.id
      },
      create: {
        userId: user.id,
        championTeamId: teams.get(demoUser.champion)?.id,
        runnerUpTeamId: teams.get(demoUser.runnerUp)?.id
      }
    });
  }

  return users;
}

async function setGroupScenario(
  teams: Awaited<ReturnType<typeof teamByCode>>,
  users: Awaited<ReturnType<typeof upsertDemoUsers>>
) {
  const groupsToScore =
    scenario === "mid" ? Object.keys(groupActualCodes).slice(0, 6) : Object.keys(groupActualCodes);

  for (const groupLetter of groupsToScore) {
    const [firstCode, secondCode] = groupActualCodes[groupLetter];

    await prisma.groupActual.upsert({
      where: { groupLetter },
      update: {
        firstTeamId: teams.get(firstCode)?.id,
        secondTeamId: teams.get(secondCode)?.id
      },
      create: {
        groupLetter,
        firstTeamId: teams.get(firstCode)?.id,
        secondTeamId: teams.get(secondCode)?.id
      }
    });
  }

  for (const user of users) {
    for (const [groupLetter, [actualFirst, actualSecond]] of Object.entries(groupActualCodes)) {
      const groupTeams = await prisma.team.findMany({
        where: { groupLetter },
        orderBy: { fifaCode: "asc" }
      });
      const fallback = groupTeams.map((team) => team.fifaCode);
      const shifted = fallback[user.pickShift % fallback.length] ?? actualFirst;
      const firstCode = user.pickShift === 0 ? actualFirst : user.pickShift === 1 ? actualSecond : shifted;
      const secondCode = user.pickShift === 0 ? actualSecond : actualFirst;

      await prisma.groupPrediction.upsert({
        where: {
          userId_groupLetter: {
            userId: user.id,
            groupLetter
          }
        },
        update: {
          firstTeamId: teams.get(firstCode)?.id,
          secondTeamId: teams.get(secondCode)?.id
        },
        create: {
          userId: user.id,
          groupLetter,
          firstTeamId: teams.get(firstCode)?.id,
          secondTeamId: teams.get(secondCode)?.id
        }
      });
    }
  }
}

async function setMatchResult(
  matchId: string,
  homeCode: string,
  awayCode: string,
  homeScore: number,
  awayScore: number,
  winnerCode: string,
  teams: Awaited<ReturnType<typeof teamByCode>>
) {
  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeTeamId: teams.get(homeCode)?.id,
      awayTeamId: teams.get(awayCode)?.id,
      homeScore,
      awayScore,
      winnerTeamId: teams.get(winnerCode)?.id,
      status: "FINISHED"
    }
  });
}

async function setKnockoutScenario(
  teams: Awaited<ReturnType<typeof teamByCode>>,
  users: Awaited<ReturnType<typeof upsertDemoUsers>>
) {
  const results =
    scenario === "mid"
      ? [
          ["J7", "MEX", "JPN", 2, 1, "MEX"],
          ["J4", "BRA", "NED", 1, 1, "BRA"]
        ] as const
      : [
          ["J7", "MEX", "JPN", 2, 1, "MEX"],
          ["J4", "BRA", "NED", 1, 1, "BRA"],
          ["H4", "MEX", "ENG", 1, 0, "MEX"],
          ["Q3", "BRA", "ARG", 3, 2, "BRA"],
          ["S2", "MEX", "BRA", 2, 2, "MEX"],
          ["F1", "MEX", "FRA", 3, 1, "MEX"]
        ] as const;

  for (const [matchId, homeCode, awayCode, homeScore, awayScore, winnerCode] of results) {
    await setMatchResult(matchId, homeCode, awayCode, homeScore, awayScore, winnerCode, teams);

    for (const [index, user] of users.entries()) {
      const predictedHomeScore = index === 0 ? homeScore : Math.max(homeScore - 1, 0);
      const predictedAwayScore = index === 0 ? awayScore : awayScore;
      const predictedWinnerTeamId =
        index === users.length - 1 ? teams.get(awayCode)?.id : teams.get(winnerCode)?.id;

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
    }
  }

  if (scenario === "end") {
    await prisma.tournamentActual.upsert({
      where: { id: "default" },
      update: {
        championTeamId: teams.get("MEX")?.id,
        runnerUpTeamId: teams.get("FRA")?.id
      },
      create: {
        id: "default",
        championTeamId: teams.get("MEX")?.id,
        runnerUpTeamId: teams.get("FRA")?.id
      }
    });
  }
}

async function main() {
  assertSafeDatabase();

  if (!["mid", "end"].includes(scenario)) {
    throw new Error("Use one of: npm run scenario:mid or npm run scenario:end");
  }

  const teams = await teamByCode();
  const users = await upsertDemoUsers(teams);

  await setGroupScenario(teams, users);
  await setKnockoutScenario(teams, users);
  await prisma.prizeConfig.upsert({
    where: { id: "default" },
    update: { firstPlacePrize: 5000, secondPlacePrize: 2500 },
    create: { id: "default", firstPlacePrize: 5000, secondPlacePrize: 2500 }
  });

  const result = await recalculateScores();
  console.log(`Demo scenario "${scenario}" applied.`);
  console.log(result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
