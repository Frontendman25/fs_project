-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "avatarFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."files" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "compressedSize" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "isCompressed" BOOLEAN NOT NULL DEFAULT false,
    "compressionRatio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "checksum" TEXT NOT NULL,
    "storageType" TEXT NOT NULL DEFAULT 'local',
    "cloudinaryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "public"."refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "public"."refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_isRevoked_idx" ON "public"."refresh_tokens"("isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "files_filename_key" ON "public"."files"("filename");

-- CreateIndex
CREATE INDEX "files_originalName_idx" ON "public"."files"("originalName");

-- CreateIndex
CREATE INDEX "files_uploadedBy_idx" ON "public"."files"("uploadedBy");

-- CreateIndex
CREATE INDEX "files_mimeType_idx" ON "public"."files"("mimeType");

-- CreateIndex
CREATE INDEX "files_createdAt_idx" ON "public"."files"("createdAt");

-- CreateIndex
CREATE INDEX "files_filename_idx" ON "public"."files"("filename");

-- CreateIndex
CREATE INDEX "files_checksum_idx" ON "public"."files"("checksum");

-- CreateIndex
CREATE INDEX "files_storageType_idx" ON "public"."files"("storageType");

-- CreateIndex
CREATE INDEX "posts_userId_idx" ON "public"."posts"("userId");

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "public"."posts"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
