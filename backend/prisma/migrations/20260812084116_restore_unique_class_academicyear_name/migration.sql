/*
  Warnings:

  - A unique constraint covering the columns `[name,tenantId]` on the table `AcademicYear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,tenantId]` on the table `Class` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AcademicYear_name_tenantId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_tenantId_key" ON "AcademicYear"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_tenantId_key" ON "Class"("name", "tenantId");
