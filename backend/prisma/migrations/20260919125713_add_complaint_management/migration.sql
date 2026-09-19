-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('ACADEMIC', 'FEES', 'TRANSPORT', 'TEACHER', 'INFRASTRUCTURE', 'HOSTEL', 'TECHNICAL', 'SAFETY', 'ADMINISTRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplaintSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "ComplaintEmotion" AS ENUM ('ANGRY', 'SAD', 'FRUSTRATED', 'WORRIED', 'URGENT', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComplaintSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'MODIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplaintAiStatus" AS ENUM ('PENDING', 'COMPLETED', 'FALLBACK');

-- CreateTable
CREATE TABLE "Complaint" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "parentUserId" INTEGER NOT NULL,
    "studentId" INTEGER,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL DEFAULT 'OTHER',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "priorityReason" TEXT,
    "sentiment" "ComplaintSentiment" NOT NULL DEFAULT 'NEUTRAL',
    "emotion" "ComplaintEmotion" NOT NULL DEFAULT 'NEUTRAL',
    "issueTag" TEXT,
    "aiSummary" TEXT,
    "aiSuggestedResolution" TEXT,
    "aiStatus" "ComplaintAiStatus" NOT NULL DEFAULT 'PENDING',
    "aiAnalyzedAt" TIMESTAMP(3),
    "department" TEXT NOT NULL DEFAULT 'Administration',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "suggestionStatus" "ComplaintSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "finalResolution" TEXT,
    "adminReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "handledById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Complaint_tenantId_status_idx" ON "Complaint"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Complaint_tenantId_category_idx" ON "Complaint"("tenantId", "category");

-- CreateIndex
CREATE INDEX "Complaint_tenantId_parentUserId_idx" ON "Complaint"("tenantId", "parentUserId");

-- CreateIndex
CREATE INDEX "Complaint_tenantId_createdAt_idx" ON "Complaint"("tenantId", "createdAt");
