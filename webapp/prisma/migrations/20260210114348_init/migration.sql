-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "lineCount" INTEGER,
    "sourceType" TEXT NOT NULL,
    "boomiConnectionId" TEXT,
    "executionId" TEXT,
    "processId" TEXT,
    "processName" TEXT,
    "executionStatus" TEXT,
    "executionMode" TEXT,
    "summary" JSONB NOT NULL,
    "topSlowShapes" JSONB,
    "errorAnalysis" JSONB,
    "processFlow" JSONB,
    "connectorStats" JSONB,
    "paginationData" JSONB,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionStartTime" TIMESTAMP(3),
    "executionEndTime" TIMESTAMP(3),

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boomi_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boomi_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boomiConnectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "processId" TEXT,
    "processName" TEXT,
    "onlyErrors" BOOLEAN NOT NULL DEFAULT true,
    "minDurationMs" INTEGER,
    "notifyEmail" TEXT,
    "notifyOnSuccess" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnError" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_logs" (
    "id" TEXT NOT NULL,
    "boomiConnectionId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestParams" JSONB,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "recordsReturned" INTEGER,
    "rateLimitRemaining" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_cache" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "analyses_userId_idx" ON "analyses"("userId");

-- CreateIndex
CREATE INDEX "analyses_boomiConnectionId_idx" ON "analyses"("boomiConnectionId");

-- CreateIndex
CREATE INDEX "analyses_executionId_idx" ON "analyses"("executionId");

-- CreateIndex
CREATE INDEX "analyses_analyzedAt_idx" ON "analyses"("analyzedAt");

-- CreateIndex
CREATE INDEX "boomi_connections_userId_idx" ON "boomi_connections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "boomi_connections_userId_accountId_key" ON "boomi_connections"("userId", "accountId");

-- CreateIndex
CREATE INDEX "scheduled_analyses_userId_idx" ON "scheduled_analyses"("userId");

-- CreateIndex
CREATE INDEX "scheduled_analyses_boomiConnectionId_idx" ON "scheduled_analyses"("boomiConnectionId");

-- CreateIndex
CREATE INDEX "scheduled_analyses_nextRunAt_idx" ON "scheduled_analyses"("nextRunAt");

-- CreateIndex
CREATE INDEX "api_usage_logs_boomiConnectionId_idx" ON "api_usage_logs"("boomiConnectionId");

-- CreateIndex
CREATE INDEX "api_usage_logs_createdAt_idx" ON "api_usage_logs"("createdAt");

-- CreateIndex
CREATE INDEX "component_cache_expiresAt_idx" ON "component_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "component_cache_accountId_componentId_key" ON "component_cache"("accountId", "componentId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_boomiConnectionId_fkey" FOREIGN KEY ("boomiConnectionId") REFERENCES "boomi_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boomi_connections" ADD CONSTRAINT "boomi_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_analyses" ADD CONSTRAINT "scheduled_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_analyses" ADD CONSTRAINT "scheduled_analyses_boomiConnectionId_fkey" FOREIGN KEY ("boomiConnectionId") REFERENCES "boomi_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_boomiConnectionId_fkey" FOREIGN KEY ("boomiConnectionId") REFERENCES "boomi_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
