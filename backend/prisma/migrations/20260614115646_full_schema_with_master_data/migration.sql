-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "motherTongue" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "religion" TEXT;

-- CreateTable
CREATE TABLE "MasterData" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" SERIAL NOT NULL,
    "formName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "control" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'text',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "maxLength" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" SERIAL NOT NULL,
    "customFieldId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterData_tenantId_category_idx" ON "MasterData"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "MasterData_category_value_tenantId_key" ON "MasterData"("category", "value", "tenantId");

-- CreateIndex
CREATE INDEX "CustomField_tenantId_idx" ON "CustomField"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_formName_name_tenantId_key" ON "CustomField"("formName", "name", "tenantId");

-- CreateIndex
CREATE INDEX "CustomFieldValue_tenantId_idx" ON "CustomFieldValue"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_customFieldId_studentId_key" ON "CustomFieldValue"("customFieldId", "studentId");

-- AddForeignKey
ALTER TABLE "MasterData" ADD CONSTRAINT "MasterData_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
