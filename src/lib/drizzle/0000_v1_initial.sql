CREATE TABLE `AccountStats` (
	`userId` text PRIMARY KEY NOT NULL,
	`goldStars` integer DEFAULT 0 NOT NULL,
	`purpleStars` integer DEFAULT 0 NOT NULL,
	`angerPenalties` integer DEFAULT 0 NOT NULL,
	`currency` integer DEFAULT 0 NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `AccountStatsLog` (
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
CREATE TABLE `Album` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`title` text NOT NULL,
	`coverUrls` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Artwork` (
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
	FOREIGN KEY (`buyerId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `AssignedTask` (
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
CREATE TABLE `CurrencyLog` (
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
CREATE TABLE `EmotionRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`type` text DEFAULT 'ANGER' NOT NULL,
	`notes` text,
	`resolved` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `FamilyNote` (
	`id` text PRIMARY KEY NOT NULL,
	`authorId` text NOT NULL,
	`text` text NOT NULL,
	`color` text DEFAULT '#FEF3C7',
	`isPinned` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`authorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `GoldStarLog` (
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
CREATE TABLE `GrowthRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`height` real,
	`weight` real,
	`date` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Visitor` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `Journal` (
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
CREATE TABLE `JournalMedia` (
	`id` text PRIMARY KEY NOT NULL,
	`journalId` text NOT NULL,
	`type` text DEFAULT 'IMAGE' NOT NULL,
	`url` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`journalId`) REFERENCES `Journal`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Media` (
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
CREATE TABLE `Order` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`visitorId` text NOT NULL,
	`amountRMB` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`qrCodeUrl` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`artworkId`) REFERENCES `Artwork`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Purchase` (
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
CREATE TABLE `PurpleStarLog` (
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
CREATE TABLE `ShopItem` (
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
CREATE TABLE `SystemSettings` (
	`id` text PRIMARY KEY DEFAULT 'app_settings' NOT NULL,
	`isClosed` integer DEFAULT false NOT NULL,
	`needsSetup` integer DEFAULT true NOT NULL,
	`starsToCoinsRatio` integer DEFAULT 10 NOT NULL,
	`coinsToRmbRatio` real DEFAULT 1 NOT NULL,
	`timezone` text DEFAULT 'Asia/Shanghai' NOT NULL,
	`systemName` text DEFAULT 'DoDoo Family' NOT NULL,
	`showAllAvatars` integer DEFAULT true NOT NULL,
	`homepageImages` text,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `Task` (
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
CREATE TABLE `Users` (
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
CREATE UNIQUE INDEX `Users_name_unique` ON `Users` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `Users_nickname_unique` ON `Users` (`nickname`);--> statement-breakpoint
CREATE TABLE `Wish` (
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
