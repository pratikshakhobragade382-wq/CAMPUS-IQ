/*
  Warnings:

  - The `gender` column on the `Staff` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email,tenantId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subdomain]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Identity" AS ENUM ('admin', 'staff', 'student', 'parent', 'principal', 'management');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('teacher', 'accountant', 'librarian', 'clerk', 'receptionist', 'nurse', 'counselor', 'coordinator', 'lab_assistant', 'peon', 'driver', 'security', 'other');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "role" "StaffRole",
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "subdomain" TEXT NOT NULL DEFAULT 'school1';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "identity" "Identity" NOT NULL DEFAULT 'admin';

-- DropEnum
DROP TYPE "Role";

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_tenantId_key" ON "Staff"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");
