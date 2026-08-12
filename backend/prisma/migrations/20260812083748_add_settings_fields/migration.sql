-- DropIndex
DROP INDEX "AcademicYear_name_tenantId_key";

-- DropIndex
DROP INDEX "Class_name_tenantId_key";

-- CreateIndex
CREATE INDEX "AcademicYear_name_tenantId_idx" ON "AcademicYear"("name", "tenantId");
