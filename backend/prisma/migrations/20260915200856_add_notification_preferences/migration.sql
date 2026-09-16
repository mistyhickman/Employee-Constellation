-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "notifyCommunityActivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyMentorshipMatches" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyProfileReminders" BOOLEAN NOT NULL DEFAULT true;
