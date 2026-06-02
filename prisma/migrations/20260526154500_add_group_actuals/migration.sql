CREATE TABLE "GroupActual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupLetter" TEXT NOT NULL,
    "firstTeamId" TEXT,
    "secondTeamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupActual_firstTeamId_fkey" FOREIGN KEY ("firstTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupActual_secondTeamId_fkey" FOREIGN KEY ("secondTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "GroupActual_groupLetter_key" ON "GroupActual"("groupLetter");
