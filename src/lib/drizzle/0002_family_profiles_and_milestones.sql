CREATE TABLE `FamilyMember` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`nickname` text,
	`relationship` text NOT NULL,
	`parentId` text,
	`gender` text,
	`avatarUrl` text,
	`birthDate` integer,
	`zodiac` text,
	`notes` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `SystemSettings` (
	`id` text PRIMARY KEY DEFAULT 'app_settings' NOT NULL,
	`isClosed` integer DEFAULT false NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Purchase` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`itemId` text NOT NULL,
	`costCoins` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
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
CREATE TABLE `__new_ShopItem` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`costCoins` integer NOT NULL,
	`iconUrl` text,
	`stock` integer DEFAULT -1 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_ShopItem`("id", "name", "description", "costCoins", "iconUrl", "stock", "isActive", "createdAt", "updatedAt") SELECT "id", "name", "description", "costCoins", "iconUrl", "stock", "isActive", "createdAt", "updatedAt" FROM `ShopItem`;--> statement-breakpoint
DROP TABLE `ShopItem`;--> statement-breakpoint
ALTER TABLE `__new_ShopItem` RENAME TO `ShopItem`;--> statement-breakpoint
CREATE TABLE `__new_Users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`nickname` text,
	`pin` text,
	`role` text DEFAULT 'CHILD' NOT NULL,
	`avatarUrl` text,
	`gender` text DEFAULT 'OTHER',
	`birthDate` integer,
	`zodiac` text,
	`isArchived` integer DEFAULT false NOT NULL,
	`isDeleted` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
INSERT INTO `__new_Users`("id", "name", "nickname", "pin", "role", "avatarUrl", "gender", "birthDate", "zodiac", "isArchived", "isDeleted", "createdAt") SELECT "id", "name", "nickname", "pin", "role", "avatarUrl", "gender", "birthDate", "zodiac", "isArchived", "isDeleted", "createdAt" FROM `Users`;--> statement-breakpoint
DROP TABLE `Users`;--> statement-breakpoint
ALTER TABLE `__new_Users` RENAME TO `Users`;--> statement-breakpoint
ALTER TABLE `Journal` ADD `imageUrls` text;--> statement-breakpoint
ALTER TABLE `Journal` ADD `isMilestone` integer DEFAULT false NOT NULL;