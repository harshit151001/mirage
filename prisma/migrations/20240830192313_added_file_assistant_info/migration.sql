/*
  Warnings:

  - A unique constraint covering the columns `[filesPath]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assistantId]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storeId]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "assistantId" TEXT,
ADD COLUMN     "filesPath" TEXT,
ADD COLUMN     "storeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Repo_filesPath_key" ON "Repo"("filesPath");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_assistantId_key" ON "Repo"("assistantId");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_storeId_key" ON "Repo"("storeId");
