ALTER TABLE `users` ADD `activeDeviceId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `activeDeviceSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `lastActiveAt` timestamp DEFAULT (now()) NOT NULL;