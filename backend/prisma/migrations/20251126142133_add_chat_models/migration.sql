-- CreateTable
CREATE TABLE "public"."chat_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderUsername" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "replyTo" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_members" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "typingUntil" TIMESTAMP(3),

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_rooms_type_idx" ON "public"."chat_rooms"("type");

-- CreateIndex
CREATE INDEX "chat_rooms_createdBy_idx" ON "public"."chat_rooms"("createdBy");

-- CreateIndex
CREATE INDEX "chat_rooms_createdAt_idx" ON "public"."chat_rooms"("createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_roomId_idx" ON "public"."chat_messages"("roomId");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "public"."chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "public"."chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_replyTo_idx" ON "public"."chat_messages"("replyTo");

-- CreateIndex
CREATE INDEX "chat_members_roomId_idx" ON "public"."chat_members"("roomId");

-- CreateIndex
CREATE INDEX "chat_members_userId_idx" ON "public"."chat_members"("userId");

-- CreateIndex
CREATE INDEX "chat_members_isOnline_idx" ON "public"."chat_members"("isOnline");

-- CreateIndex
CREATE UNIQUE INDEX "chat_members_roomId_userId_key" ON "public"."chat_members"("roomId", "userId");

-- CreateIndex
CREATE INDEX "chat_notifications_userId_idx" ON "public"."chat_notifications"("userId");

-- CreateIndex
CREATE INDEX "chat_notifications_roomId_idx" ON "public"."chat_notifications"("roomId");

-- CreateIndex
CREATE INDEX "chat_notifications_isRead_idx" ON "public"."chat_notifications"("isRead");

-- CreateIndex
CREATE INDEX "chat_notifications_createdAt_idx" ON "public"."chat_notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_notifications" ADD CONSTRAINT "chat_notifications_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
