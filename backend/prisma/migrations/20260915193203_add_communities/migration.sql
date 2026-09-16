-- CreateEnum
CREATE TYPE "CommunityRole" AS ENUM ('member', 'leader');

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonCommunity" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "role" "CommunityRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonCommunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Community_canonicalName_key" ON "Community"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "PersonCommunity_personId_communityId_key" ON "PersonCommunity"("personId", "communityId");

-- AddForeignKey
ALTER TABLE "PersonCommunity" ADD CONSTRAINT "PersonCommunity_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonCommunity" ADD CONSTRAINT "PersonCommunity_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
