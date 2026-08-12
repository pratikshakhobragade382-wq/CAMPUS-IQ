-- CreateEnum
CREATE TYPE "public"."HomeworkSubmissionStatus" AS ENUM ('pending', 'submitted', 'late', 'graded');

-- CreateEnum
CREATE TYPE "public"."NotificationAudience" AS ENUM ('all', 'admin', 'staff', 'teacher', 'student', 'parent', 'class', 'individual');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "address" TEXT,
ADD COLUMN     "defaultAcademicYear" TEXT,
ADD COLUMN     "defaultClass" TEXT,
ADD COLUMN     "defaultSection" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "parentId" INTEGER,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "classId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "attachmentUrl" TEXT,
    "maxMarks" INTEGER DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssignmentSubmission" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "content" TEXT,
    "attachmentUrl" TEXT,
    "status" "public"."HomeworkSubmissionStatus" NOT NULL DEFAULT 'submitted',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grade" INTEGER,
    "feedback" TEXT,
    "gradedById" INTEGER,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'normal',
    "audience" "public"."NotificationAudience" NOT NULL,
    "classId" INTEGER,
    "sectionId" INTEGER,
    "userId" INTEGER,
    "createdById" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationRead" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResultPublication" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "examId" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedById" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultPublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assignment_tenantId_classId_sectionId_subjectId_idx" ON "public"."Assignment"("tenantId" ASC, "classId" ASC, "sectionId" ASC, "subjectId" ASC);

-- CreateIndex
CREATE INDEX "Assignment_tenantId_teacherId_idx" ON "public"."Assignment"("tenantId" ASC, "teacherId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_tenantId_assignmentId_studentId_key" ON "public"."AssignmentSubmission"("tenantId" ASC, "assignmentId" ASC, "studentId" ASC);

-- CreateIndex
CREATE INDEX "AssignmentSubmission_tenantId_studentId_idx" ON "public"."AssignmentSubmission"("tenantId" ASC, "studentId" ASC);

-- CreateIndex
CREATE INDEX "Notification_tenantId_audience_isActive_idx" ON "public"."Notification"("tenantId" ASC, "audience" ASC, "isActive" ASC);

-- CreateIndex
CREATE INDEX "Notification_tenantId_classId_idx" ON "public"."Notification"("tenantId" ASC, "classId" ASC);

-- CreateIndex
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "public"."Notification"("tenantId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_tenantId_userId_idx" ON "public"."Notification"("tenantId" ASC, "userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRead_notificationId_userId_key" ON "public"."NotificationRead"("notificationId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "NotificationRead_tenantId_userId_idx" ON "public"."NotificationRead"("tenantId" ASC, "userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ResultPublication_academicYearId_classId_examId_key" ON "public"."ResultPublication"("academicYearId" ASC, "classId" ASC, "examId" ASC);

-- CreateIndex
CREATE INDEX "ResultPublication_tenantId_academicYearId_idx" ON "public"."ResultPublication"("tenantId" ASC, "academicYearId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_parentId_key" ON "public"."User"("parentId" ASC);

-- AddForeignKey
ALTER TABLE "public"."AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationRead" ADD CONSTRAINT "NotificationRead_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationRead" ADD CONSTRAINT "NotificationRead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResultPublication" ADD CONSTRAINT "ResultPublication_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResultPublication" ADD CONSTRAINT "ResultPublication_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResultPublication" ADD CONSTRAINT "ResultPublication_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResultPublication" ADD CONSTRAINT "ResultPublication_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResultPublication" ADD CONSTRAINT "ResultPublication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."StudentParent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

