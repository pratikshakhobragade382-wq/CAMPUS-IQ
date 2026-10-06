-- CreateTable
CREATE TABLE IF NOT EXISTS "ExamSubjectSchedule" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "examId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "examDate" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSubjectSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ExamSubjectSchedule_examId_subjectId_key" ON "ExamSubjectSchedule"("examId", "subjectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExamSubjectSchedule_tenantId_examId_idx" ON "ExamSubjectSchedule"("tenantId", "examId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ExamSubjectSchedule_examId_fkey'
    ) THEN
        ALTER TABLE "ExamSubjectSchedule" ADD CONSTRAINT "ExamSubjectSchedule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ExamSubjectSchedule_subjectId_fkey'
    ) THEN
        ALTER TABLE "ExamSubjectSchedule" ADD CONSTRAINT "ExamSubjectSchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ExamSubjectSchedule_tenantId_fkey'
    ) THEN
        ALTER TABLE "ExamSubjectSchedule" ADD CONSTRAINT "ExamSubjectSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
