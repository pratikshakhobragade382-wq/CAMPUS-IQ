/*
  Warnings:

  - You are about to drop the column `address` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the `CustomFieldOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CustomFieldOption" DROP CONSTRAINT "CustomFieldOption_customFieldId_fkey";

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "address",
ADD COLUMN     "aadharNo" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "busUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "caste" TEXT,
ADD COLUMN     "cbseTid" TEXT,
ADD COLUMN     "ctetExamQualified" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContactNo" TEXT,
ADD COLUMN     "emergencyContactPerson" TEXT,
ADD COLUMN     "employeeLedger" TEXT,
ADD COLUMN     "employeePresentDuty" TEXT,
ADD COLUMN     "employeeUniqueId" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "fileNo" TEXT,
ADD COLUMN     "highQualification" TEXT,
ADD COLUMN     "identificationMark" TEXT,
ADD COLUMN     "isReviewer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leaveCategory" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "mobileNo" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "motherTongue" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "noticePeriod" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "officialEmail" TEXT,
ADD COLUMN     "panNo" TEXT,
ADD COLUMN     "placeOfBirth" TEXT,
ADD COLUMN     "priorityNo" TEXT,
ADD COLUMN     "qualificationForPrinting" TEXT,
ADD COLUMN     "relationWithEmployee" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "reportPerson" TEXT,
ADD COLUMN     "rfidNo" TEXT,
ADD COLUMN     "signatureUrl" TEXT,
ADD COLUMN     "socialCategory" TEXT,
ADD COLUMN     "staffCategory" TEXT,
ADD COLUMN     "staffDirectory" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "uanNo" TEXT;

-- DropTable
DROP TABLE "CustomFieldOption";

-- CreateTable
CREATE TABLE "StaffAddress" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "presentAddress" TEXT,
    "presentCity" TEXT,
    "presentState" TEXT,
    "presentCountry" TEXT,
    "presentPinCode" TEXT,
    "presentTelephoneNo" TEXT,
    "permanentAddress" TEXT,
    "permanentCity" TEXT,
    "permanentState" TEXT,
    "permanentCountry" TEXT,
    "permanentPinCode" TEXT,
    "permanentTelephoneNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffOtherDetails" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "dateOfAppointment" TIMESTAMP(3),
    "probationUpto" TIMESTAMP(3),
    "dateOfConfirmation" TIMESTAMP(3),
    "designation" TEXT,
    "fromDate" TIMESTAMP(3),
    "natureOfAppointment" TEXT,
    "passportNo" TEXT,
    "passportIssuePlace" TEXT,
    "passportIssueDate" TIMESTAMP(3),
    "passportExpireDate" TIMESTAMP(3),
    "visaNo" TEXT,
    "visaIssuePlace" TEXT,
    "visaIssueDate" TIMESTAMP(3),
    "visaExpiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffOtherDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSpouse" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "mobileNo" TEXT,
    "marriageDate" TIMESTAMP(3),
    "qualification" TEXT,
    "employerDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSpouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffChild" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "schoolName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffChild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffAddress_staffId_key" ON "StaffAddress"("staffId");

-- CreateIndex
CREATE INDEX "StaffAddress_tenantId_idx" ON "StaffAddress"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffOtherDetails_staffId_key" ON "StaffOtherDetails"("staffId");

-- CreateIndex
CREATE INDEX "StaffOtherDetails_tenantId_idx" ON "StaffOtherDetails"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSpouse_staffId_key" ON "StaffSpouse"("staffId");

-- CreateIndex
CREATE INDEX "StaffSpouse_tenantId_idx" ON "StaffSpouse"("tenantId");

-- CreateIndex
CREATE INDEX "StaffChild_staffId_idx" ON "StaffChild"("staffId");

-- CreateIndex
CREATE INDEX "StaffChild_tenantId_idx" ON "StaffChild"("tenantId");

-- AddForeignKey
ALTER TABLE "StaffAddress" ADD CONSTRAINT "StaffAddress_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffOtherDetails" ADD CONSTRAINT "StaffOtherDetails_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSpouse" ADD CONSTRAINT "StaffSpouse_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffChild" ADD CONSTRAINT "StaffChild_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
