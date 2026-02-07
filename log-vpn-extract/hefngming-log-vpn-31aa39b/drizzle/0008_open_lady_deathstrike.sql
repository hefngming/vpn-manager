ALTER TABLE `deviceFingerprints` MODIFY COLUMN `planName` varchar(100);--> statement-breakpoint
ALTER TABLE `deviceFingerprints` MODIFY COLUMN `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `deviceName` varchar(255);--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `deviceType` varchar(50);--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `os` varchar(100);--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `osVersion` varchar(50);--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `cpuModel` varchar(255);--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `totalMemory` bigint;--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `macAddress` varchar(100);--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `lastActiveAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `deviceFingerprints` ADD `bindedAt` timestamp DEFAULT (now()) NOT NULL;