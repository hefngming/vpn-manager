ALTER TABLE `subscriptions` MODIFY COLUMN `status` enum('active','expired','cancelled','pending','suspended') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `monthlyTrafficLimit` bigint DEFAULT 214748364800 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `monthlyTrafficUsed` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `dailyTrafficLimit` bigint DEFAULT 10737418240 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `dailyTrafficUsed` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `lastDailyResetDate` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `lastMonthlyResetDate` timestamp;