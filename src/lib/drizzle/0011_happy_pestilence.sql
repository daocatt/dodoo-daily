CREATE TABLE `BankHoldings` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`investmentId` text NOT NULL,
	`shares` real NOT NULL,
	`averageCost` real NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`investmentId`) REFERENCES `BankInvestment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `BankInvestment` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`currentNetValue` real DEFAULT 1 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `BankTransaction` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`investmentId` text,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`shares` real DEFAULT 0,
	`price` real,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`description` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`investmentId`) REFERENCES `BankInvestment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `LedgerCategory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emoji` text NOT NULL,
	`type` text NOT NULL,
	`isSystem` integer DEFAULT false NOT NULL,
	`creatorId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`creatorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `LedgerRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`categoryId` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`date` integer NOT NULL,
	`description` text,
	`relatedUserId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryId`) REFERENCES `LedgerCategory`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`relatedUserId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `AccountStats` ADD `fiatBalance` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `AccountStats` ADD `bankBalance` real DEFAULT 0 NOT NULL;