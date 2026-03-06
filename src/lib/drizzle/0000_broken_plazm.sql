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
CREATE TABLE `Album` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`title` text NOT NULL,
	`coverUrls` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
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
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`albumId`) REFERENCES `Album`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyerId`) REFERENCES `Guest`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `EmotionRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`type` text DEFAULT 'ANGER' NOT NULL,
	`notes` text,
	`resolved` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Guest` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `Journal` (
	`id` text PRIMARY KEY NOT NULL,
	`authorId` text,
	`authorRole` text NOT NULL,
	`text` text,
	`imageUrl` text,
	`voiceUrl` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`authorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Order` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`guestId` text NOT NULL,
	`amountRMB` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`qrCodeUrl` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer,
	FOREIGN KEY (`artworkId`) REFERENCES `Artwork`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guestId`) REFERENCES `Guest`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Purchase` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`itemId` text NOT NULL,
	`costCoins` integer NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `ShopItem`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ShopItem` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`costCoins` integer NOT NULL,
	`iconUrl` text,
	`stock` integer DEFAULT -1 NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `Task` (
	`id` text PRIMARY KEY NOT NULL,
	`assignedTo` text,
	`title` text NOT NULL,
	`description` text,
	`isRepeating` integer DEFAULT false NOT NULL,
	`rewardStars` integer DEFAULT 1 NOT NULL,
	`startTime` integer,
	`endTime` integer,
	`completed` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer,
	FOREIGN KEY (`assignedTo`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pin` text,
	`role` text DEFAULT 'CHILD' NOT NULL,
	`avatarUrl` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now'))
);
