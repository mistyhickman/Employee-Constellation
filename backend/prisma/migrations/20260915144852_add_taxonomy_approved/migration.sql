-- AlterTable
ALTER TABLE "Industry" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Interest" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT true;
