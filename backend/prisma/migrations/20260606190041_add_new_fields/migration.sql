/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `bhojanshalas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bhojanshalas_slug_key" ON "bhojanshalas"("slug");
