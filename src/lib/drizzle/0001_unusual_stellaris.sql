CREATE TABLE `AccountStatsLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`balance` integer NOT NULL,
	`reason` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Purchase` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`itemId` text NOT NULL,
	`costCoins` integer NOT NULL,
	`status` text,
	`remarks` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `ShopItem`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Purchase`("id", "userId", "itemId", "costCoins", "status", "remarks", "createdAt", "updatedAt") SELECT "id", "userId", "itemId", "costCoins", "status", "remarks", "createdAt", "updatedAt" FROM `Purchase`;--> statement-breakpoint
DROP TABLE `Purchase`;--> statement-breakpoint
ALTER TABLE `__new_Purchase` RENAME TO `Purchase`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `ShopItem` ADD `description` text;--> statement-breakpoint
ALTER TABLE `ShopItem` ADD `isActive` integer;--> statement-breakpoint
ALTER TABLE `ShopItem` ADD `updatedAt` integer;--> statement-breakpoint
ALTER TABLE `Users` ADD `isArchived` integer;--> statement-breakpoint
ALTER TABLE `Users` ADD `isDeleted` integer;