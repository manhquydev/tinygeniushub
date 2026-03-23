-- CreateTable
CREATE TABLE "ReaderAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "image" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReaderSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReaderSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogBookmark" (
    "id" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogReaderNotification" (
    "id" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "payload" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "BlogReaderNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReaderAccount_email_key" ON "ReaderAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ReaderSession_tokenHash_key" ON "ReaderSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ReaderSession_readerId_idx" ON "ReaderSession"("readerId");

-- CreateIndex
CREATE INDEX "ReaderSession_expiresAt_idx" ON "ReaderSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogBookmark_readerId_postId_key" ON "BlogBookmark"("readerId", "postId");

-- CreateIndex
CREATE INDEX "BlogBookmark_readerId_createdAt_idx" ON "BlogBookmark"("readerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BlogBookmark_postId_createdAt_idx" ON "BlogBookmark"("postId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BlogReaderNotification_readerId_isRead_createdAt_idx" ON "BlogReaderNotification"("readerId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BlogReaderNotification_readerId_createdAt_idx" ON "BlogReaderNotification"("readerId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ReaderSession" ADD CONSTRAINT "ReaderSession_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "ReaderAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogBookmark" ADD CONSTRAINT "BlogBookmark_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "ReaderAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogBookmark" ADD CONSTRAINT "BlogBookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReaderNotification" ADD CONSTRAINT "BlogReaderNotification_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "ReaderAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;