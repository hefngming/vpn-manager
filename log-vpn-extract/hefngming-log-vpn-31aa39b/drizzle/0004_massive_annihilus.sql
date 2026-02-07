CREATE TABLE `deviceFingerprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`planName` varchar(100) NOT NULL,
	`userAgent` text,
	`screenResolution` varchar(50),
	`timezone` varchar(50),
	`language` varchar(20),
	`hardwareInfo` text,
	`activatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deviceFingerprints_id` PRIMARY KEY(`id`),
	CONSTRAINT `deviceFingerprints_fingerprint_unique` UNIQUE(`fingerprint`)
);
