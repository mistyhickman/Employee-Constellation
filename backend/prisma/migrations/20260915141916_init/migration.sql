-- CreateEnum
CREATE TYPE "InterestKind" AS ENUM ('professional', 'personal');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('employee', 'directory', 'admin', 'ai_suggested');

-- CreateEnum
CREATE TYPE "InterestDirection" AS ENUM ('current', 'want_to_explore');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('worked_together', 'mentor', 'mentee', 'sme_known', 'professional_contact', 'community', 'client_industry');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('private', 'team', 'company', 'leadership');

-- CreateEnum
CREATE TYPE "ProfileSection" AS ENUM ('basic', 'skills', 'organizations', 'professional_interests', 'personal_interests', 'connections');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('edit', 'view');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "entraObjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "preferredName" TEXT,
    "pronouns" TEXT,
    "photoUrl" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "managerId" TEXT,
    "workEmail" TEXT NOT NULL,
    "location" TEXT,
    "timezone" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "type" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "kind" "InterestKind" NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonSkill" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" TEXT,
    "yearsExperience" DOUBLE PRECISION,
    "lastUsed" TIMESTAMP(3),
    "willingToMentor" BOOLEAN NOT NULL DEFAULT false,
    "wantsToLearn" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'employee',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonIndustry" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "depthOfExperience" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'employee',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonIndustry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonOrganization" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "relationshipType" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "role" TEXT,
    "description" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'employee',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonInterest" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,
    "direction" "InterestDirection" NOT NULL DEFAULT 'current',
    "source" "DataSource" NOT NULL DEFAULT 'employee',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonConnection" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "connectedPersonId" TEXT NOT NULL,
    "relationshipType" "ConnectionType" NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'team',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonRole" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "PersonRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisibilitySetting" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "section" "ProfileSection" NOT NULL,
    "level" "Visibility" NOT NULL DEFAULT 'team',

    CONSTRAINT "VisibilitySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "DataSource" NOT NULL DEFAULT 'employee',
    "action" "AuditAction" NOT NULL DEFAULT 'edit',

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_entraObjectId_key" ON "Person"("entraObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_workEmail_key" ON "Person"("workEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_canonicalName_key" ON "Skill"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_canonicalName_key" ON "Industry"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_canonicalName_key" ON "Organization"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_canonicalName_kind_key" ON "Interest"("canonicalName", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PersonSkill_personId_skillId_key" ON "PersonSkill"("personId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonIndustry_personId_industryId_key" ON "PersonIndustry"("personId", "industryId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonInterest_personId_interestId_direction_key" ON "PersonInterest"("personId", "interestId", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "PersonConnection_personId_connectedPersonId_relationshipTyp_key" ON "PersonConnection"("personId", "connectedPersonId", "relationshipType");

-- CreateIndex
CREATE UNIQUE INDEX "PersonRole_personId_roleId_key" ON "PersonRole"("personId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "VisibilitySetting_personId_section_key" ON "VisibilitySetting"("personId", "section");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSkill" ADD CONSTRAINT "PersonSkill_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSkill" ADD CONSTRAINT "PersonSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIndustry" ADD CONSTRAINT "PersonIndustry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIndustry" ADD CONSTRAINT "PersonIndustry_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonOrganization" ADD CONSTRAINT "PersonOrganization_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonOrganization" ADD CONSTRAINT "PersonOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonInterest" ADD CONSTRAINT "PersonInterest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonInterest" ADD CONSTRAINT "PersonInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonConnection" ADD CONSTRAINT "PersonConnection_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonConnection" ADD CONSTRAINT "PersonConnection_connectedPersonId_fkey" FOREIGN KEY ("connectedPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRole" ADD CONSTRAINT "PersonRole_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRole" ADD CONSTRAINT "PersonRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilitySetting" ADD CONSTRAINT "VisibilitySetting_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
