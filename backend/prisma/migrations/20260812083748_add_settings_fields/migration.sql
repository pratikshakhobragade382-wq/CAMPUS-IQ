-- DropIndex
DROP INDEX IF EXISTS "AcademicYear_name_tenantId_key";

-- DropIndex
DROP INDEX IF EXISTS "Class_name_tenantId_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AcademicYear_name_tenantId_idx"
ON "AcademicYear"("name", "tenantId");