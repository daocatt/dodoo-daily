CREATE TABLE `GuestMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`guestId` text,
	`memberId` text,
	`targetUserId` text NOT NULL,
	`text` text NOT NULL,
	`isPublic` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`guestId`) REFERENCES `Guest`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`targetUserId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Order` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`guestId` text,
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
	FOREIGN KEY (`guestId`) REFERENCES `Guest`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Order`("id", "artworkId", "guestId", "amountRMB", "amountCoins", "paymentType", "status", "contactName", "contactPhone", "contactEmail", "shippingAddress", "trackingNumber", "qrCodeUrl", "createdAt", "updatedAt") SELECT "id", "artworkId", "guestId", "amountRMB", "amountCoins", "paymentType", "status", "contactName", "contactPhone", "contactEmail", "shippingAddress", "trackingNumber", "qrCodeUrl", "createdAt", "updatedAt" FROM `Order`;--> statement-breakpoint
DROP TABLE `Order`;--> statement-breakpoint
ALTER TABLE `__new_Order` RENAME TO `Order`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `Artwork` ADD `buyerMemberId` text REFERENCES Users(id);--> statement-breakpoint
ALTER TABLE `Guest` ADD `password` text;