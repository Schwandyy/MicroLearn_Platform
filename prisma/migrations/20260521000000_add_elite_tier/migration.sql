-- Add ELITE value to SubscriptionTier enum (non-destructive, after PRO)
ALTER TYPE "SubscriptionTier" ADD VALUE 'ELITE' AFTER 'PRO';

-- Add isEliteOnly flag to LearningPath (non-destructive, default false)
ALTER TABLE "LearningPath" ADD COLUMN "isEliteOnly" BOOLEAN NOT NULL DEFAULT false;
