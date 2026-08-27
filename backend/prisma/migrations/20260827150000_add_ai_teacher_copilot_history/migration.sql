CREATE TABLE "AIConversation" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIMessage" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIConversation_tenantId_userId_idx"
ON "AIConversation"("tenantId", "userId");

CREATE INDEX "AIConversation_tenantId_updatedAt_idx"
ON "AIConversation"("tenantId", "updatedAt");

CREATE INDEX "AIMessage_tenantId_userId_idx"
ON "AIMessage"("tenantId", "userId");

CREATE INDEX "AIMessage_conversationId_createdAt_idx"
ON "AIMessage"("conversationId", "createdAt");

ALTER TABLE "AIConversation"
ADD CONSTRAINT "AIConversation_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIConversation"
ADD CONSTRAINT "AIConversation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIMessage"
ADD CONSTRAINT "AIMessage_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIMessage"
ADD CONSTRAINT "AIMessage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIMessage"
ADD CONSTRAINT "AIMessage_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;