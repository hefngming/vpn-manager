DROP TABLE `autoReviewLogs`;--> statement-breakpoint
DROP TABLE `autoReviewRules`;--> statement-breakpoint
DROP TABLE `deviceFingerprints`;--> statement-breakpoint
DROP TABLE `deviceWhitelist`;--> statement-breakpoint
DROP TABLE `nodes`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
DROP TABLE `paymentConfigs`;--> statement-breakpoint
DROP TABLE `paymentProofs`;--> statement-breakpoint
DROP TABLE `plans`;--> statement-breakpoint
DROP TABLE `referral_codes`;--> statement-breakpoint
DROP TABLE `referral_records`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
DROP TABLE `systemSettings`;--> statement-breakpoint
DROP TABLE `trafficLogs`;--> statement-breakpoint
DROP TABLE `userPasswords`;--> statement-breakpoint
DROP TABLE `verificationCodes`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordHash`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `activeDeviceId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `activeDeviceSessionId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `lastActiveAt`;