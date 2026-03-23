CREATE TABLE `AccountStats` (
	`userId` text PRIMARY KEY NOT NULL,
	`goldStars` integer DEFAULT 0 NOT NULL,
	`purpleStars` integer DEFAULT 0 NOT NULL,
	`angerPenalties` integer DEFAULT 0 NOT NULL,
	`currency` integer DEFAULT 0 NOT NULL,
	`fiatBalance` real DEFAULT 0 NOT NULL,
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
	`isPublic` integer DEFAULT false NOT NULL,
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
	`isFeatured` integer DEFAULT false NOT NULL,
	`buyerId` text,
	`buyerMemberId` text,
	`isArchived` integer DEFAULT false NOT NULL,
	`isPublic` integer DEFAULT false NOT NULL,
	`isApproved` integer DEFAULT false NOT NULL,
	`exhibitionDescription` text,
	`likes` integer DEFAULT 0 NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`albumId`) REFERENCES `Album`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyerId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyerMemberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ArtworkLike` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`visitorId` text,
	`memberId` text,
	`ip` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`artworkId`) REFERENCES `Artwork`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `HomeWidget` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`size` text DEFAULT 'SMALL' NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `IpBlacklist` (
	`id` text PRIMARY KEY NOT NULL,
	`ip` text NOT NULL,
	`reason` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `IpBlacklist_ip_unique` ON `IpBlacklist` (`ip`);--> statement-breakpoint
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
CREATE TABLE `Media` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`fileName` text NOT NULL,
	`fileType` text NOT NULL,
	`mimeType` text,
	`size` integer,
	`storageProvider` text DEFAULT 'LOCAL' NOT NULL,
	`path` text NOT NULL,
	`thumbnailMedium` text,
	`thumbnailLarge` text,
	`key` text NOT NULL,
	`bucket` text,
	`userId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `MemberLoginLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`ip` text,
	`userAgent` text,
	`status` text DEFAULT 'SUCCESS' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Order` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`visitorId` text,
	`memberId` text,
	`amountRMB` real DEFAULT 0 NOT NULL,
	`amountCoins` integer DEFAULT 0 NOT NULL,
	`paymentType` text DEFAULT 'COINS' NOT NULL,
	`status` text DEFAULT 'PENDING_CONFIRM' NOT NULL,
	`contactName` text,
	`contactPhone` text,
	`contactEmail` text,
	`shippingAddress` text,
	`trackingNumber` text,
	`qrCodeUrl` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`artworkId`) REFERENCES `Artwork`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `PushSubscription` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`deviceType` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PushSubscription_endpoint_unique` ON `PushSubscription` (`endpoint`);--> statement-breakpoint
CREATE TABLE `RechargeCode` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`amount` integer NOT NULL,
	`isUsed` integer DEFAULT false NOT NULL,
	`usedByVisitorId` text,
	`usedByMemberId` text,
	`usedAt` integer,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`usedByVisitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usedByMemberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `RechargeCode_code_unique` ON `RechargeCode` (`code`);--> statement-breakpoint
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
CREATE TABLE `storageItems` (
	`id` text PRIMARY KEY NOT NULL,
	`creatorId` text,
	`name` text NOT NULL,
	`imageUrl` text NOT NULL,
	`notes` text,
	`tags` text DEFAULT '[]',
	`purchasePrice` real DEFAULT 0,
	`resalePrice` real DEFAULT 0,
	`purchaseDate` integer,
	`isForSale` integer DEFAULT false NOT NULL,
	`isSynced` integer DEFAULT false NOT NULL,
	`isDeleted` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`creatorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `storageTransfers` (
	`id` text PRIMARY KEY NOT NULL,
	`itemId` text NOT NULL,
	`transferDate` integer NOT NULL,
	`salePrice` real NOT NULL,
	`deliveryMethod` text,
	`buyerId` text,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`itemId`) REFERENCES `storageItems`(`id`) ON UPDATE no action ON DELETE no action
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
	`systemSubtitle` text,
	`showAllAvatars` integer DEFAULT true NOT NULL,
	`requireVisitorApproval` integer DEFAULT true NOT NULL,
	`requireInvitationCode` integer DEFAULT false NOT NULL,
	`visitorInvitationCode` text,
	`disableVisitorLogin` integer DEFAULT false NOT NULL,
	`disableVisitorRegistration` integer DEFAULT false NOT NULL,
	`hideFamilyLogin` integer DEFAULT false NOT NULL,
	`homepageImages` text,
	`defaultLocale` text DEFAULT 'en' NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `Task` (
	`id` text PRIMARY KEY NOT NULL,
	`creatorId` text,
	`assignerId` text,
	`assigneeId` text,
	`title` text NOT NULL,
	`description` text,
	`isRepeating` integer DEFAULT false NOT NULL,
	`isMonthlyRepeating` integer DEFAULT false NOT NULL,
	`rewardStars` integer DEFAULT 1 NOT NULL,
	`rewardCoins` integer DEFAULT 0 NOT NULL,
	`confirmationStatus` text,
	`plannedTime` integer,
	`completed` integer DEFAULT false NOT NULL,
	`completedById` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`creatorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignerId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigneeId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completedById`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`nickname` text,
	`slug` text,
	`exhibitionEnabled` integer DEFAULT true NOT NULL,
	`pin` text,
	`role` text DEFAULT 'CHILD' NOT NULL,
	`avatarUrl` text,
	`gender` text DEFAULT 'OTHER',
	`birthDate` integer,
	`zodiac` text,
	`chineseZodiac` text,
	`isArchived` integer DEFAULT false NOT NULL,
	`isDeleted` integer DEFAULT false NOT NULL,
	`isLocked` integer DEFAULT false NOT NULL,
	`permissionRole` text DEFAULT 'USER' NOT NULL,
	`lastLoginAt` integer,
	`locale` text DEFAULT 'en' NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`exhibitionTitle` text,
	`exhibitionSubtitle` text,
	`exhibitionDescription` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Users_name_unique` ON `Users` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `Users_nickname_unique` ON `Users` (`nickname`);--> statement-breakpoint
CREATE UNIQUE INDEX `Users_slug_unique` ON `Users` (`slug`);--> statement-breakpoint
CREATE TABLE `Visitor` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`password` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`currency` integer DEFAULT 0 NOT NULL,
	`lastIp` text,
	`address` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
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
CREATE TABLE `VisitorMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`visitorId` text,
	`memberId` text,
	`targetUserId` text NOT NULL,
	`text` text NOT NULL,
	`isPublic` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`targetUserId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
