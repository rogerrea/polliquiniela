CREATE TABLE "PrizeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "firstPlacePrize" INTEGER,
    "secondPlacePrize" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
