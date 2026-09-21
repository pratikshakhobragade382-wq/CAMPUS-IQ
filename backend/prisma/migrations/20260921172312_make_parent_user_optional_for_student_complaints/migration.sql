-- AlterTable
ALTER TABLE "Complaint" ALTER COLUMN "parentUserId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Substitution" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "timetableId" INTEGER NOT NULL,
    "originalStaffId" INTEGER NOT NULL,
    "substituteStaffId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "remark" TEXT,
    "assignedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Substitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotQA" (
    "id" SERIAL NOT NULL,
    "keywords" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotQA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Substitution_tenantId_idx" ON "Substitution"("tenantId");

-- CreateIndex
CREATE INDEX "Substitution_substituteStaffId_date_idx" ON "Substitution"("substituteStaffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Substitution_tenantId_timetableId_date_key" ON "Substitution"("tenantId", "timetableId", "date");

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_originalStaffId_fkey" FOREIGN KEY ("originalStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_substituteStaffId_fkey" FOREIGN KEY ("substituteStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
