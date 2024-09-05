/*
  Warnings:

  - A unique constraint covering the columns `[userId,owner,name]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Repo_userId_owner_name_key" ON "Repo"("userId", "owner", "name");
