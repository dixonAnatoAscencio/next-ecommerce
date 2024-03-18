/*
  Warnings:

  - You are about to drop the column `isPay` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "isPay",
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;
