/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `Token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "refreshToken";
