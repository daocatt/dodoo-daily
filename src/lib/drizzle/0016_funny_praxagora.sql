PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_AccountStatsLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`balance` integer NOT NULL,
	`reason` text NOT NULL,
	`actorId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_AccountStatsLog`("id", "userId", "type", "amount", "balance", "reason", "actorId", "createdAt") SELECT "id", "userId", "type", "amount", "balance", "reason", "actorId", "createdAt" FROM `AccountStatsLog`;--> statement-breakpoint
DROP TABLE `AccountStatsLog`;--> statement-breakpoint
ALTER TABLE `__new_AccountStatsLog` RENAME TO `AccountStatsLog`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_Album` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`title` text NOT NULL,
	`coverUrls` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Album`("id", "userId", "title", "coverUrls", "createdAt", "updatedAt") SELECT "id", "userId", "title", "coverUrls", "createdAt", "updatedAt" FROM `Album`;--> statement-breakpoint
DROP TABLE `Album`;--> statement-breakpoint
ALTER TABLE `__new_Album` RENAME TO `Album`;--> statement-breakpoint
CREATE TABLE `__new_Artwork` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`title` text NOT NULL,
	`imageUrl` text NOT NULL,
	`priceRMB` real DEFAULT 0 NOT NULL,
	`priceCoins` integer DEFAULT 0 NOT NULL,
	`albumId` text,
	`isSold` integer DEFAULT false NOT NULL,
	`buyerId` text,
	`isArchived` integer DEFAULT false NOT NULL,
	`isPublic` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`albumId`) REFERENCES `Album`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyerId`) REFERENCES `Guest`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Artwork`("id", "userId", "title", "imageUrl", "priceRMB", "priceCoins", "albumId", "isSold", "buyerId", "isArchived", "isPublic", "createdAt") SELECT "id", "userId", "title", "imageUrl", "priceRMB", "priceCoins", "albumId", "isSold", "buyerId", "isArchived", "isPublic", "createdAt" FROM `Artwork`;--> statement-breakpoint
DROP TABLE `Artwork`;--> statement-breakpoint
ALTER TABLE `__new_Artwork` RENAME TO `Artwork`;--> statement-breakpoint
CREATE TABLE `__new_AssignedTask` (
	`id` text PRIMARY KEY NOT NULL,
	`assignerId` text,
	`assigneeId` text,
	`title` text NOT NULL,
	`description` text,
	`isRepeating` integer DEFAULT false NOT NULL,
	`isMonthlyRepeating` integer DEFAULT false NOT NULL,
	`rewardStars` integer DEFAULT 1 NOT NULL,
	`rewardCoins` integer DEFAULT 0 NOT NULL,
	`confirmationStatus` text DEFAULT 'PENDING',
	`plannedTime` integer,
	`completed` integer DEFAULT false NOT NULL,
	`completedById` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`assignerId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigneeId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completedById`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_AssignedTask`("id", "assignerId", "assigneeId", "title", "description", "isRepeating", "isMonthlyRepeating", "rewardStars", "rewardCoins", "confirmationStatus", "plannedTime", "completed", "completedById", "createdAt", "updatedAt") SELECT "id", "assignerId", "assigneeId", "title", "description", "isRepeating", "isMonthlyRepeating", "rewardStars", "rewardCoins", "confirmationStatus", "plannedTime", "completed", "completedById", "createdAt", "updatedAt" FROM `AssignedTask`;--> statement-breakpoint
DROP TABLE `AssignedTask`;--> statement-breakpoint
ALTER TABLE `__new_AssignedTask` RENAME TO `AssignedTask`;--> statement-breakpoint
CREATE TABLE `__new_CurrencyLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`amount` integer NOT NULL,
	`balance` integer NOT NULL,
	`reason` text NOT NULL,
	`actorId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_CurrencyLog`("id", "userId", "amount", "balance", "reason", "actorId", "createdAt") SELECT "id", "userId", "amount", "balance", "reason", "actorId", "createdAt" FROM `CurrencyLog`;--> statement-breakpoint
DROP TABLE `CurrencyLog`;--> statement-breakpoint
ALTER TABLE `__new_CurrencyLog` RENAME TO `CurrencyLog`;--> statement-breakpoint
CREATE TABLE `__new_EmotionRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`type` text DEFAULT 'ANGER' NOT NULL,
	`notes` text,
	`resolved` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_EmotionRecord`("id", "userId", "type", "notes", "resolved", "createdAt") SELECT "id", "userId", "type", "notes", "resolved", "createdAt" FROM `EmotionRecord`;--> statement-breakpoint
DROP TABLE `EmotionRecord`;--> statement-breakpoint
ALTER TABLE `__new_EmotionRecord` RENAME TO `EmotionRecord`;--> statement-breakpoint
CREATE TABLE `__new_GoldStarLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`amount` integer NOT NULL,
	`balance` integer NOT NULL,
	`reason` text NOT NULL,
	`actorId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_GoldStarLog`("id", "userId", "amount", "balance", "reason", "actorId", "createdAt") SELECT "id", "userId", "amount", "balance", "reason", "actorId", "createdAt" FROM `GoldStarLog`;--> statement-breakpoint
DROP TABLE `GoldStarLog`;--> statement-breakpoint
ALTER TABLE `__new_GoldStarLog` RENAME TO `GoldStarLog`;--> statement-breakpoint
CREATE TABLE `__new_GrowthRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`height` real,
	`weight` real,
	`date` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_GrowthRecord`("id", "userId", "height", "weight", "date", "createdAt") SELECT "id", "userId", "height", "weight", "date", "createdAt" FROM `GrowthRecord`;--> statement-breakpoint
DROP TABLE `GrowthRecord`;--> statement-breakpoint
ALTER TABLE `__new_GrowthRecord` RENAME TO `GrowthRecord`;--> statement-breakpoint
CREATE TABLE `__new_Guest` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
INSERT INTO `__new_Guest`("id", "name", "phone", "createdAt") SELECT "id", "name", "phone", "createdAt" FROM `Guest`;--> statement-breakpoint
DROP TABLE `Guest`;--> statement-breakpoint
ALTER TABLE `__new_Guest` RENAME TO `Guest`;--> statement-breakpoint
CREATE TABLE `__new_Journal` (
	`id` text PRIMARY KEY NOT NULL,
	`authorId` text,
	`authorRole` text NOT NULL,
	`text` text,
	`imageUrl` text,
	`imageUrls` text,
	`voiceUrl` text,
	`isMilestone` integer DEFAULT false NOT NULL,
	`milestoneDate` integer,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`authorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Journal`("id", "authorId", "authorRole", "text", "imageUrl", "imageUrls", "voiceUrl", "isMilestone", "milestoneDate", "createdAt", "updatedAt") SELECT "id", "authorId", "authorRole", "text", "imageUrl", "imageUrls", "voiceUrl", "isMilestone", "milestoneDate", "createdAt", "updatedAt" FROM `Journal`;--> statement-breakpoint
DROP TABLE `Journal`;--> statement-breakpoint
ALTER TABLE `__new_Journal` RENAME TO `Journal`;--> statement-breakpoint
CREATE TABLE `__new_Media` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`fileName` text NOT NULL,
	`fileType` text NOT NULL,
	`mimeType` text,
	`size` integer,
	`storageProvider` text DEFAULT 'LOCAL' NOT NULL,
	`path` text NOT NULL,
	`key` text NOT NULL,
	`bucket` text,
	`userId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Media`("id", "name", "fileName", "fileType", "mimeType", "size", "storageProvider", "path", "key", "bucket", "userId", "createdAt", "updatedAt") SELECT "id", "name", "fileName", "fileType", "mimeType", "size", "storageProvider", "path", "key", "bucket", "userId", "createdAt", "updatedAt" FROM `Media`;--> statement-breakpoint
DROP TABLE `Media`;--> statement-breakpoint
ALTER TABLE `__new_Media` RENAME TO `Media`;--> statement-breakpoint
CREATE TABLE `__new_Order` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`guestId` text NOT NULL,
	`amountRMB` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`qrCodeUrl` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`artworkId`) REFERENCES `Artwork`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guestId`) REFERENCES `Guest`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Order`("id", "artworkId", "guestId", "amountRMB", "status", "qrCodeUrl", "createdAt", "updatedAt") SELECT "id", "artworkId", "guestId", "amountRMB", "status", "qrCodeUrl", "createdAt", "updatedAt" FROM `Order`;--> statement-breakpoint
DROP TABLE `Order`;--> statement-breakpoint
ALTER TABLE `__new_Order` RENAME TO `Order`;--> statement-breakpoint
CREATE TABLE `__new_Purchase` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`itemId` text NOT NULL,
	`costCoins` integer NOT NULL,
	`itemName` text,
	`itemIconUrl` text,
	`itemDescription` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`remarks` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `ShopItem`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Purchase`("id", "userId", "itemId", "costCoins", "itemName", "itemIconUrl", "itemDescription", "status", "remarks", "createdAt", "updatedAt") SELECT "id", "userId", "itemId", "costCoins", "itemName", "itemIconUrl", "itemDescription", "status", "remarks", "createdAt", "updatedAt" FROM `Purchase`;--> statement-breakpoint
DROP TABLE `Purchase`;--> statement-breakpoint
ALTER TABLE `__new_Purchase` RENAME TO `Purchase`;--> statement-breakpoint
CREATE TABLE `__new_PurpleStarLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`amount` integer NOT NULL,
	`balance` integer NOT NULL,
	`reason` text NOT NULL,
	`actorId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_PurpleStarLog`("id", "userId", "amount", "balance", "reason", "actorId", "createdAt") SELECT "id", "userId", "amount", "balance", "reason", "actorId", "createdAt" FROM `PurpleStarLog`;--> statement-breakpoint
DROP TABLE `PurpleStarLog`;--> statement-breakpoint
ALTER TABLE `__new_PurpleStarLog` RENAME TO `PurpleStarLog`;--> statement-breakpoint
CREATE TABLE `__new_ShopItem` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`costCoins` integer NOT NULL,
	`iconUrl` text,
	`stock` integer DEFAULT -1 NOT NULL,
	`deliveryDays` integer DEFAULT 1 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`isDeleted` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_ShopItem`("id", "name", "description", "costCoins", "iconUrl", "stock", "deliveryDays", "isActive", "isDeleted", "createdAt", "updatedAt") SELECT "id", "name", "description", "costCoins", "iconUrl", "stock", "deliveryDays", "isActive", "isDeleted", "createdAt", "updatedAt" FROM `ShopItem`;--> statement-breakpoint
DROP TABLE `ShopItem`;--> statement-breakpoint
ALTER TABLE `__new_ShopItem` RENAME TO `ShopItem`;--> statement-breakpoint
CREATE TABLE `__new_Task` (
	`id` text PRIMARY KEY NOT NULL,
	`creatorId` text,
	`title` text NOT NULL,
	`description` text,
	`isRepeating` integer DEFAULT false NOT NULL,
	`isMonthlyRepeating` integer DEFAULT false NOT NULL,
	`rewardStars` integer DEFAULT 1 NOT NULL,
	`rewardCoins` integer DEFAULT 0 NOT NULL,
	`plannedTime` integer,
	`completed` integer DEFAULT false NOT NULL,
	`completedById` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`creatorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completedById`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Task`("id", "creatorId", "title", "description", "isRepeating", "isMonthlyRepeating", "rewardStars", "rewardCoins", "plannedTime", "completed", "completedById", "createdAt", "updatedAt") SELECT "id", "creatorId", "title", "description", "isRepeating", "isMonthlyRepeating", "rewardStars", "rewardCoins", "plannedTime", "completed", "completedById", "createdAt", "updatedAt" FROM `Task`;--> statement-breakpoint
DROP TABLE `Task`;--> statement-breakpoint
ALTER TABLE `__new_Task` RENAME TO `Task`;--> statement-breakpoint
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
	`chineseZodiac` text,
	`isArchived` integer DEFAULT false NOT NULL,
	`isDeleted` integer DEFAULT false NOT NULL,
	`lastLoginAt` integer,
	`createdAt` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
INSERT INTO `__new_Users`("id", "name", "nickname", "pin", "role", "avatarUrl", "gender", "birthDate", "zodiac", "chineseZodiac", "isArchived", "isDeleted", "lastLoginAt", "createdAt") SELECT "id", "name", "nickname", "pin", "role", "avatarUrl", "gender", "birthDate", "zodiac", "chineseZodiac", "isArchived", "isDeleted", "lastLoginAt", "createdAt" FROM `Users`;--> statement-breakpoint
DROP TABLE `Users`;--> statement-breakpoint
ALTER TABLE `__new_Users` RENAME TO `Users`;--> statement-breakpoint
CREATE UNIQUE INDEX `Users_name_unique` ON `Users` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `Users_nickname_unique` ON `Users` (`nickname`);--> statement-breakpoint
CREATE TABLE `__new_Wish` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`imageUrl` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`addedToShopAt` integer,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Wish`("id", "userId", "name", "description", "imageUrl", "status", "addedToShopAt", "createdAt", "updatedAt") SELECT "id", "userId", "name", "description", "imageUrl", "status", "addedToShopAt", "createdAt", "updatedAt" FROM `Wish`;--> statement-breakpoint
DROP TABLE `Wish`;--> statement-breakpoint
ALTER TABLE `__new_Wish` RENAME TO `Wish`;