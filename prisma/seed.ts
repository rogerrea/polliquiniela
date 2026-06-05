import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const VERIFY_URL =
  "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums";

const teamsCsv = `
A|MEX|México|https://flagcdn.com/mx.svg
A|RSA|Sudáfrica|https://flagcdn.com/za.svg
A|KOR|Corea del Sur|https://flagcdn.com/kr.svg
A|CZE|Chequia|https://flagcdn.com/cz.svg
B|CAN|Canadá|https://flagcdn.com/ca.svg
B|BIH|Bosnia y Herzegovina|https://flagcdn.com/ba.svg
B|QAT|Qatar|https://flagcdn.com/qa.svg
B|SUI|Suiza|https://flagcdn.com/ch.svg
C|BRA|Brasil|https://flagcdn.com/br.svg
C|MAR|Marruecos|https://flagcdn.com/ma.svg
C|HAI|Haití|https://flagcdn.com/ht.svg
C|SCO|Escocia|https://flagcdn.com/gb-sct.svg
D|USA|Estados Unidos|https://flagcdn.com/us.svg
D|PAR|Paraguay|https://flagcdn.com/py.svg
D|AUS|Australia|https://flagcdn.com/au.svg
D|TUR|Turquía|https://flagcdn.com/tr.svg
E|GER|Alemania|https://flagcdn.com/de.svg
E|CUW|Curazao|https://flagcdn.com/cw.svg
E|CIV|Costa de Marfil|https://flagcdn.com/ci.svg
E|ECU|Ecuador|https://flagcdn.com/ec.svg
F|NED|Países Bajos|https://flagcdn.com/nl.svg
F|JPN|Japón|https://flagcdn.com/jp.svg
F|SWE|Suecia|https://flagcdn.com/se.svg
F|TUN|Túnez|https://flagcdn.com/tn.svg
G|BEL|Bélgica|https://flagcdn.com/be.svg
G|EGY|Egipto|https://flagcdn.com/eg.svg
G|IRN|Irán|https://flagcdn.com/ir.svg
G|NZL|Nueva Zelanda|https://flagcdn.com/nz.svg
H|ESP|España|https://flagcdn.com/es.svg
H|CPV|Cabo Verde|https://flagcdn.com/cv.svg
H|KSA|Arabia Saudita|https://flagcdn.com/sa.svg
H|URU|Uruguay|https://flagcdn.com/uy.svg
I|FRA|Francia|https://flagcdn.com/fr.svg
I|SEN|Senegal|https://flagcdn.com/sn.svg
I|IRQ|Irak|https://flagcdn.com/iq.svg
I|NOR|Noruega|https://flagcdn.com/no.svg
J|ARG|Argentina|https://flagcdn.com/ar.svg
J|ALG|Argelia|https://flagcdn.com/dz.svg
J|AUT|Austria|https://flagcdn.com/at.svg
J|JOR|Jordania|https://flagcdn.com/jo.svg
K|POR|Portugal|https://flagcdn.com/pt.svg
K|COD|RD Congo|https://flagcdn.com/cd.svg
K|UZB|Uzbekistán|https://flagcdn.com/uz.svg
K|COL|Colombia|https://flagcdn.com/co.svg
L|ENG|Inglaterra|https://flagcdn.com/gb-eng.svg
L|CRO|Croacia|https://flagcdn.com/hr.svg
L|GHA|Ghana|https://flagcdn.com/gh.svg
L|PAN|Panamá|https://flagcdn.com/pa.svg
`;

const matchesCsv = `
G1|1|GROUP|A|MEX|RSA|A1|A2|2026-06-11T21:00:00.000Z|Estadio Banorte, Mexico City
G2|2|GROUP|A|KOR|CZE|A3|A4|2026-06-12T04:00:00.000Z|Estadio Akron, Guadalajara
G3|3|GROUP|B|CAN|BIH|B1|B2|2026-06-12T21:00:00.000Z|BMO Field, Toronto
G4|4|GROUP|D|USA|PAR|D1|D2|2026-06-13T03:00:00.000Z|SoFi Stadium, Los Angeles
G5|5|GROUP|C|HAI|SCO|C3|C4|2026-06-14T03:00:00.000Z|Gillette Stadium, Boston
G6|6|GROUP|D|AUS|TUR|D3|D4|2026-06-14T06:00:00.000Z|BC Place, Vancouver
G7|7|GROUP|C|BRA|MAR|C1|C2|2026-06-14T00:00:00.000Z|MetLife Stadium, New York
G8|8|GROUP|B|QAT|SUI|B3|B4|2026-06-13T21:00:00.000Z|Levi's Stadium, San Francisco
G9|9|GROUP|E|CIV|ECU|E3|E4|2026-06-15T01:00:00.000Z|Lincoln Financial Field, Philadelphia
G10|10|GROUP|E|GER|CUW|E1|E2|2026-06-14T19:00:00.000Z|NRG Stadium, Houston
G11|11|GROUP|F|NED|JPN|F1|F2|2026-06-14T22:00:00.000Z|AT&T Stadium, Dallas
G12|12|GROUP|F|SWE|TUN|F3|F4|2026-06-15T04:00:00.000Z|Estadio BBVA, Monterrey
G13|13|GROUP|H|KSA|URU|H3|H4|2026-06-16T00:00:00.000Z|Hard Rock Stadium, Miami
G14|14|GROUP|H|ESP|CPV|H1|H2|2026-06-15T18:00:00.000Z|Mercedes-Benz Stadium, Atlanta
G15|15|GROUP|G|IRN|NZL|G3|G4|2026-06-16T03:00:00.000Z|SoFi Stadium, Los Angeles
G16|16|GROUP|G|BEL|EGY|G1|G2|2026-06-15T21:00:00.000Z|Lumen Field, Seattle
G17|17|GROUP|I|FRA|SEN|I1|I2|2026-06-16T21:00:00.000Z|MetLife Stadium, New York
G18|18|GROUP|I|IRQ|NOR|I3|I4|2026-06-17T00:00:00.000Z|Gillette Stadium, Boston
G19|19|GROUP|J|ARG|ALG|J1|J2|2026-06-17T03:00:00.000Z|GEHA Field at Arrowhead Stadium, Kansas City
G20|20|GROUP|J|AUT|JOR|J3|J4|2026-06-17T06:00:00.000Z|Levi's Stadium, San Francisco
G21|21|GROUP|L|GHA|PAN|L3|L4|2026-06-18T01:00:00.000Z|BMO Field, Toronto
G22|22|GROUP|L|ENG|CRO|L1|L2|2026-06-17T22:00:00.000Z|AT&T Stadium, Dallas
G23|23|GROUP|K|POR|COD|K1|K2|2026-06-17T19:00:00.000Z|NRG Stadium, Houston
G24|24|GROUP|K|UZB|COL|K3|K4|2026-06-18T04:00:00.000Z|Estadio Banorte, Mexico City
G25|25|GROUP|A|CZE|RSA|A4|A2|2026-06-18T18:00:00.000Z|Mercedes-Benz Stadium, Atlanta
G26|26|GROUP|B|SUI|BIH|B4|B2|2026-06-18T21:00:00.000Z|SoFi Stadium, Los Angeles
G27|27|GROUP|B|CAN|QAT|B1|B3|2026-06-19T00:00:00.000Z|BC Place, Vancouver
G28|28|GROUP|A|MEX|KOR|A1|A3|2026-06-19T03:00:00.000Z|Estadio Akron, Guadalajara
G29|29|GROUP|C|BRA|HAI|C1|C3|2026-06-20T03:00:00.000Z|Lincoln Financial Field, Philadelphia
G30|30|GROUP|C|SCO|MAR|C4|C2|2026-06-20T00:00:00.000Z|Gillette Stadium, Boston
G31|31|GROUP|D|TUR|PAR|D4|D2|2026-06-20T06:00:00.000Z|Levi's Stadium, San Francisco
G32|32|GROUP|D|USA|AUS|D1|D3|2026-06-19T21:00:00.000Z|Lumen Field, Seattle
G33|33|GROUP|E|GER|CIV|E1|E3|2026-06-20T22:00:00.000Z|BMO Field, Toronto
G34|34|GROUP|E|ECU|CUW|E4|E2|2026-06-21T02:00:00.000Z|GEHA Field at Arrowhead Stadium, Kansas City
G35|35|GROUP|F|NED|SWE|F1|F4|2026-06-20T19:00:00.000Z|NRG Stadium, Houston
G36|36|GROUP|F|TUN|JPN|F4|F2|2026-06-21T06:00:00.000Z|Estadio BBVA, Monterrey
G37|37|GROUP|H|URU|CPV|H4|H2|2026-06-22T00:00:00.000Z|Hard Rock Stadium, Miami
G38|38|GROUP|H|ESP|KSA|H1|H3|2026-06-21T18:00:00.000Z|Mercedes-Benz Stadium, Atlanta
G39|39|GROUP|G|BEL|IRN|G1|G3|2026-06-21T21:00:00.000Z|SoFi Stadium, Los Angeles
G40|40|GROUP|G|NZL|EGY|G4|G2|2026-06-22T03:00:00.000Z|BC Place, Vancouver
G41|41|GROUP|I|NOR|SEN|I4|I2|2026-06-23T02:00:00.000Z|MetLife Stadium, New York
G42|42|GROUP|I|FRA|IRQ|I1|I3|2026-06-22T23:00:00.000Z|Lincoln Financial Field, Philadelphia
G43|43|GROUP|J|ARG|AUT|J1|J3|2026-06-22T19:00:00.000Z|AT&T Stadium, Dallas
G44|44|GROUP|J|JOR|ALG|J4|J2|2026-06-23T05:00:00.000Z|Levi's Stadium, San Francisco
G45|45|GROUP|L|ENG|GHA|L1|L3|2026-06-23T22:00:00.000Z|Gillette Stadium, Boston
G46|46|GROUP|L|PAN|CRO|L4|L2|2026-06-24T01:00:00.000Z|BMO Field, Toronto
G47|47|GROUP|K|POR|UZB|K1|K3|2026-06-23T19:00:00.000Z|NRG Stadium, Houston
G48|48|GROUP|K|COL|COD|K4|K2|2026-06-24T04:00:00.000Z|Estadio Akron, Guadalajara
G49|49|GROUP|C|SCO|BRA|C4|C1|2026-06-25T00:00:00.000Z|Hard Rock Stadium, Miami
G50|50|GROUP|C|MAR|HAI|C2|C3|2026-06-25T00:00:00.000Z|Mercedes-Benz Stadium, Atlanta
G51|51|GROUP|B|SUI|CAN|B4|B1|2026-06-24T21:00:00.000Z|BC Place, Vancouver
G52|52|GROUP|B|BIH|QAT|B2|B3|2026-06-24T21:00:00.000Z|Lumen Field, Seattle
G53|53|GROUP|A|CZE|MEX|A4|A1|2026-06-25T03:00:00.000Z|Estadio Banorte, Mexico City
G54|54|GROUP|A|RSA|KOR|A2|A3|2026-06-25T03:00:00.000Z|Estadio BBVA, Monterrey
G55|55|GROUP|E|CUW|CIV|E2|E3|2026-06-25T22:00:00.000Z|Lincoln Financial Field, Philadelphia
G56|56|GROUP|E|ECU|GER|E4|E1|2026-06-25T22:00:00.000Z|MetLife Stadium, New York
G57|57|GROUP|F|JPN|SWE|F2|F4|2026-06-26T01:00:00.000Z|AT&T Stadium, Dallas
G58|58|GROUP|F|TUN|NED|F4|F1|2026-06-26T01:00:00.000Z|GEHA Field at Arrowhead Stadium, Kansas City
G59|59|GROUP|D|TUR|USA|D4|D1|2026-06-26T04:00:00.000Z|SoFi Stadium, Los Angeles
G60|60|GROUP|D|PAR|AUS|D2|D3|2026-06-26T04:00:00.000Z|Levi's Stadium, San Francisco
G61|61|GROUP|I|NOR|FRA|I4|I1|2026-06-26T21:00:00.000Z|Gillette Stadium, Boston
G62|62|GROUP|I|SEN|IRQ|I2|I3|2026-06-26T21:00:00.000Z|BMO Field, Toronto
G63|63|GROUP|G|EGY|IRN|G2|G3|2026-06-27T05:00:00.000Z|Lumen Field, Seattle
G64|64|GROUP|G|NZL|BEL|G4|G1|2026-06-27T05:00:00.000Z|BC Place, Vancouver
G65|65|GROUP|H|CPV|KSA|H2|H3|2026-06-27T02:00:00.000Z|NRG Stadium, Houston
G66|66|GROUP|H|URU|ESP|H4|H1|2026-06-27T02:00:00.000Z|Estadio Akron, Guadalajara
G67|67|GROUP|L|PAN|ENG|L4|L1|2026-06-27T23:00:00.000Z|MetLife Stadium, New York
G68|68|GROUP|L|CRO|GHA|L2|L3|2026-06-27T23:00:00.000Z|Lincoln Financial Field, Philadelphia
G69|69|GROUP|J|ALG|AUT|J2|J3|2026-06-28T04:00:00.000Z|GEHA Field at Arrowhead Stadium, Kansas City
G70|70|GROUP|J|JOR|ARG|J4|J1|2026-06-28T04:00:00.000Z|AT&T Stadium, Dallas
G71|71|GROUP|K|COL|POR|K4|K1|2026-06-28T01:30:00.000Z|Hard Rock Stadium, Miami
G72|72|GROUP|K|COD|UZB|K2|K3|2026-06-28T01:30:00.000Z|Mercedes-Benz Stadium, Atlanta
J1|1|ROUND_OF_32||||2A|2B|2026-06-28T21:00:00.000Z|SoFi Stadium, Los Angeles
J2|2|ROUND_OF_32||||1E|3ABCDF|2026-06-29T22:30:00.000Z|Gillette Stadium, Boston
J3|3|ROUND_OF_32||||1F|2C|2026-06-30T03:00:00.000Z|Estadio BBVA, Monterrey
J4|4|ROUND_OF_32||||1C|2F|2026-06-29T19:00:00.000Z|NRG Stadium, Houston
J5|5|ROUND_OF_32||||1I|3CDFGH|2026-06-30T23:00:00.000Z|MetLife Stadium, New York
J6|6|ROUND_OF_32||||2E|2I|2026-06-30T19:00:00.000Z|AT&T Stadium, Dallas
J7|7|ROUND_OF_32||||1A|3CEFHI|2026-07-01T03:00:00.000Z|Estadio Banorte, Mexico City
J8|8|ROUND_OF_32||||1L|3EHIJK|2026-07-01T18:00:00.000Z|Mercedes-Benz Stadium, Atlanta
J9|9|ROUND_OF_32||||1D|3BEFIJ|2026-07-02T02:00:00.000Z|Levi's Stadium, San Francisco
J10|10|ROUND_OF_32||||1G|3AEHIJ|2026-07-01T22:00:00.000Z|Lumen Field, Seattle
J11|11|ROUND_OF_32||||2K|2L|2026-07-03T01:00:00.000Z|BMO Field, Toronto
J12|12|ROUND_OF_32||||1H|2J|2026-07-02T21:00:00.000Z|SoFi Stadium, Los Angeles
J13|13|ROUND_OF_32||||1B|3EFGIJ|2026-07-03T05:00:00.000Z|BC Place, Vancouver
J14|14|ROUND_OF_32||||1J|2H|2026-07-04T00:00:00.000Z|Hard Rock Stadium, Miami
J15|15|ROUND_OF_32||||1K|3DEIJL|2026-07-04T03:30:00.000Z|GEHA Field at Arrowhead Stadium, Kansas City
J16|16|ROUND_OF_32||||2D|2G|2026-07-03T20:00:00.000Z|AT&T Stadium, Dallas
H1|1|ROUND_OF_16||||WJ2|WJ5|2026-07-04T23:00:00.000Z|Lincoln Financial Field, Philadelphia
H2|2|ROUND_OF_16||||WJ1|WJ3|2026-07-04T19:00:00.000Z|NRG Stadium, Houston
H3|3|ROUND_OF_16||||WJ4|WJ6|2026-07-05T22:00:00.000Z|MetLife Stadium, New York
H4|4|ROUND_OF_16||||WJ7|WJ8|2026-07-06T02:00:00.000Z|Estadio Banorte, Mexico City
H5|5|ROUND_OF_16||||WJ11|WJ12|2026-07-06T21:00:00.000Z|AT&T Stadium, Dallas
H6|6|ROUND_OF_16||||WJ9|WJ10|2026-07-07T02:00:00.000Z|Lumen Field, Seattle
H7|7|ROUND_OF_16||||WJ14|WJ16|2026-07-07T18:00:00.000Z|Mercedes-Benz Stadium, Atlanta
H8|8|ROUND_OF_16||||WJ13|WJ15|2026-07-07T22:00:00.000Z|BC Place, Vancouver
Q1|1|QUARTER_FINAL||||WH1|WH2|2026-07-09T22:00:00.000Z|Gillette Stadium, Boston
Q2|2|QUARTER_FINAL||||WH5|WH6|2026-07-10T21:00:00.000Z|SoFi Stadium, Los Angeles
Q3|3|QUARTER_FINAL||||WH3|WH4|2026-07-11T23:00:00.000Z|Hard Rock Stadium, Miami
Q4|4|QUARTER_FINAL||||WH7|WH8|2026-07-12T03:00:00.000Z|GEHA Field at Arrowhead Stadium, Kansas City
S1|1|SEMI_FINAL||||WQ1|WQ2|2026-07-14T21:00:00.000Z|AT&T Stadium, Dallas
S2|2|SEMI_FINAL||||WQ3|WQ4|2026-07-15T21:00:00.000Z|Mercedes-Benz Stadium, Atlanta
T1|1|THIRD_PLACE||||LS1|LS2|2026-07-18T23:00:00.000Z|Hard Rock Stadium, Miami
F1|1|FINAL||||WS1|WS2|2026-07-19T21:00:00.000Z|MetLife Stadium, New York
`;

async function main() {
  const passwordHash = await bcrypt.hash("email-only-login", 10);

  await prisma.user.upsert({
    where: { email: "admin@grupalia.com" },
    update: { name: "Admin", isAdmin: true, passwordHash },
    create: {
      name: "Admin",
      email: "admin@grupalia.com",
      passwordHash,
      isAdmin: true
    }
  });

  await prisma.user.upsert({
    where: { email: "usuario@grupalia.com" },
    update: { name: "Usuario de prueba", passwordHash },
    create: {
      name: "Usuario de prueba",
      email: "usuario@grupalia.com",
      passwordHash
    }
  });

  await prisma.prediction.deleteMany({});
  await prisma.tournamentPrediction.deleteMany({});
  await prisma.groupPrediction.deleteMany({});
  await prisma.groupActual.deleteMany({});
  await prisma.emailLoginCode.deleteMany({});
  await prisma.prizeConfig.deleteMany({});
  await prisma.match.deleteMany({});

  const teamByCode = new Map<string, string>();
  const officialTeamCodes = teamsCsv
    .trim()
    .split("\n")
    .map((line) => line.split("|")[1]);

  for (const line of teamsCsv.trim().split("\n")) {
    const [groupLetter, fifaCode, name, flagUrl] = line.split("|");
    const team = await prisma.team.upsert({
      where: { fifaCode },
      update: { name, groupLetter, flagUrl },
      create: { name, fifaCode, groupLetter, flagUrl }
    });
    teamByCode.set(fifaCode, team.id);
  }

  await prisma.team.deleteMany({
    where: {
      fifaCode: {
        notIn: officialTeamCodes
      }
    }
  });

  for (const line of matchesCsv.trim().split("\n")) {
    const [
      id,
      matchNumber,
      stage,
      groupLetter,
      homeCode,
      awayCode,
      homeSeed,
      awaySeed,
      startsAt,
      venue
    ] = line.split("|");

    await prisma.match.create({
      data: {
        id,
        fifaMatchNumber: Number(matchNumber),
        stage,
        groupLetter: groupLetter || null,
        homeTeamId: homeCode ? teamByCode.get(homeCode) : null,
        awayTeamId: awayCode ? teamByCode.get(awayCode) : null,
        homeSeed: homeSeed || null,
        awaySeed: awaySeed || null,
        startsAt: new Date(startsAt),
        venue,
        verifyUrl: VERIFY_URL,
        status: "SCHEDULED"
      }
    });
  }

  await prisma.tournamentActual.upsert({
    where: { id: "default" },
    update: {
      championTeamId: null,
      runnerUpTeamId: null,
      topScorerName: null
    },
    create: { id: "default" }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
