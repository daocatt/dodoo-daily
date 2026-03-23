CREATE TABLE `VisitorCurrencyLog` (
	`id` text PRIMARY KEY NOT NULL,
	`visitorId` text NOT NULL,
	`amount` integer NOT NULL,
	`balance` integer NOT NULL,
	`reason` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `RechargeCode` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`amount` integer NOT NULL,
	`isUsed` integer DEFAULT false NOT NULL,
	`usedByVisitorId` text,
	`usedAt` integer,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`usedByVisitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `RechargeCode_code_unique` ON `RechargeCode` (`code`);--> statement-breakpoint
ALTER TABLE `Visitor` ADD `currency` integer DEFAULT 0 NOT NULL;