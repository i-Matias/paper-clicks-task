/*
  Warnings:

  - A unique constraint covering the columns `[userId,repoId]` on the table `StarredRepository` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "StarredRepository_repoId_key";

-- CreateIndex
CREATE UNIQUE INDEX "StarredRepository_userId_repoId_key" ON "StarredRepository"("userId", "repoId");
