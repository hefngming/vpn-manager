CREATE TABLE `autoReviewLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentProofId` int NOT NULL,
	`ruleId` int,
	`ruleName` varchar(100),
	`decision` enum('auto_approved','auto_rejected','manual_review_required','no_rule_matched') NOT NULL,
	`reason` text,
	`conditionsChecked` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `autoReviewLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `autoReviewRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`conditions` text NOT NULL,
	`action` enum('auto_approve','auto_reject','manual_review') NOT NULL,
	`autoApproveDays` int DEFAULT 30,
	`autoApproveTrafficGB` int DEFAULT 200,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autoReviewRules_id` PRIMARY KEY(`id`)
);
