-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
 CREATE TYPE "FamilyRole" AS ENUM ('ADMIN', 'MEMBER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "family_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_groups_pkey" PRIMARY KEY ("id")
);

-- Adicionar coluna createdBy se não existir (para tabelas já criadas)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'family_groups' 
        AND column_name = 'createdBy'
    ) THEN
        ALTER TABLE family_groups ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "family_group_members" (
    "id" TEXT NOT NULL,
    "familyGroupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if they don't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "family_group_members_familyGroupId_userId_key" ON "family_group_members"("familyGroupId", "userId");

CREATE INDEX IF NOT EXISTS "family_group_members_userId_idx" ON "family_group_members"("userId");

CREATE INDEX IF NOT EXISTS "family_group_members_familyGroupId_idx" ON "family_group_members"("familyGroupId");

-- AddForeignKey (only if they don't exist)
DO $$ BEGIN
 ALTER TABLE "family_group_members" ADD CONSTRAINT "family_group_members_familyGroupId_fkey" FOREIGN KEY ("familyGroupId") REFERENCES "family_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "family_group_members" ADD CONSTRAINT "family_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

