-- Clean orphaned avatar references (no matching file row)
UPDATE "users"
SET "avatarFileId" = NULL
WHERE "avatarFileId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "files" WHERE "files"."id" = "users"."avatarFileId"
  );

-- If multiple users share the same avatar file, keep the earliest user only
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "avatarFileId"
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM "users"
  WHERE "avatarFileId" IS NOT NULL
)
UPDATE "users"
SET "avatarFileId" = NULL
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);

-- Enforce 1:1 (one file → at most one user) and referential integrity
CREATE UNIQUE INDEX "users_avatarFileId_key" ON "users"("avatarFileId");

ALTER TABLE "users"
ADD CONSTRAINT "users_avatarFileId_fkey"
FOREIGN KEY ("avatarFileId") REFERENCES "files"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
