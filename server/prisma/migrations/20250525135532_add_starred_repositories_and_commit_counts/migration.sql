-- CreateTable
CREATE TABLE "StarredRepository" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "StarredRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitCount" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StarredRepository_repoId_key" ON "StarredRepository"("repoId");

-- AddForeignKey
ALTER TABLE "StarredRepository" ADD CONSTRAINT "StarredRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitCount" ADD CONSTRAINT "CommitCount_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "StarredRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
