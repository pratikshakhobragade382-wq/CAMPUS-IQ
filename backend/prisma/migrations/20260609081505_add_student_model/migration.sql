/*
  Warnings:

  - The values [teacher] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Teacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeacherSubject` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email,tenantId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('new', 'transfer', 'readmission');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('admin', 'staff', 'student');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'admin';
COMMIT;

-- DropForeignKey
ALTER TABLE "Teacher" DROP CONSTRAINT "Teacher_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Teacher" DROP CONSTRAINT "Teacher_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherSubject" DROP CONSTRAINT "TeacherSubject_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherSubject" DROP CONSTRAINT "TeacherSubject_teacherId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- DropTable
DROP TABLE "Teacher";

-- DropTable
DROP TABLE "TeacherSubject";

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "gender" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "salary" DECIMAL(10,2),
    "address" TEXT,
    "photoUrl" TEXT,
    "departmentId" INTEGER,
    "tenantId" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSubject" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "feeNo" TEXT,
    "siblingAdmNo" TEXT,
    "studentName" TEXT NOT NULL,
    "childLivingWith" TEXT,
    "photoUrl" TEXT,
    "signatureUrl" TEXT,
    "fatherTitle" TEXT,
    "fatherName" TEXT,
    "motherTitle" TEXT,
    "motherName" TEXT,
    "classId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "stream" TEXT,
    "feeGroup" TEXT,
    "feePaymentStartFrom" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfAdmission" TIMESTAMP(3),
    "dateOfJoin" TIMESTAMP(3),
    "rollNo" TEXT,
    "gender" "Gender",
    "admissionType" "AdmissionType" NOT NULL DEFAULT 'new',
    "classAdmitted" TEXT,
    "emergencyPhoneNo" TEXT,
    "house" TEXT,
    "boardingCategory" TEXT,
    "board" TEXT,
    "medium" TEXT,
    "boardRegistrationNo" TEXT,
    "studentEmail" TEXT,
    "countryCode" TEXT,
    "communicationMobile" TEXT,
    "communicationEmail" TEXT,
    "aadharNo" TEXT,
    "remark" TEXT,
    "feeRemark" TEXT,
    "uniqueNo" TEXT,
    "grNo" TEXT,
    "rfidNo" TEXT,
    "eNach" TEXT,
    "bankName" TEXT,
    "accountNo" TEXT,
    "ifsc" TEXT,
    "virtualAccountNo" TEXT,
    "apaarId" TEXT,
    "srnNo" TEXT,
    "tenantId" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentParent" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "relation" TEXT NOT NULL,
    "title" TEXT,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "signatureUrl" TEXT,
    "qualification" TEXT,
    "occupation" TEXT,
    "designation" TEXT,
    "organizationName" TEXT,
    "organizationAddress" TEXT,
    "email" TEXT,
    "aadharNo" TEXT,
    "mobile" TEXT,
    "telephoneNo" TEXT,
    "nationality" TEXT,
    "annualIncome" DECIMAL(12,2),
    "annualIncomeSlab" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pinCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Staff_tenantId_idx" ON "Staff"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_employeeId_tenantId_key" ON "Staff"("employeeId", "tenantId");

-- CreateIndex
CREATE INDEX "StaffSubject_tenantId_idx" ON "StaffSubject"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSubject_staffId_subjectId_key" ON "StaffSubject"("staffId", "subjectId");

-- CreateIndex
CREATE INDEX "Student_tenantId_idx" ON "Student"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNo_tenantId_key" ON "Student"("admissionNo", "tenantId");

-- CreateIndex
CREATE INDEX "StudentParent_studentId_idx" ON "StudentParent"("studentId");

-- CreateIndex
CREATE INDEX "StudentParent_tenantId_idx" ON "StudentParent"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_tenantId_key" ON "User"("email", "tenantId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubject" ADD CONSTRAINT "StaffSubject_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubject" ADD CONSTRAINT "StaffSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
