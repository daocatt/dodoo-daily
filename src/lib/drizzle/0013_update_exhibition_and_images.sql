PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Order` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`visitorId` text NOT NULL,
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
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Order`("id", "artworkId", "visitorId", "amountRMB", "amountCoins", "paymentType", "status", "qrCodeUrl", "createdAt", "updatedAt") SELECT "id", "artworkId", "visitorId", "amountRMB", "amountCoins", "paymentType", "status", "qrCodeUrl", "createdAt", "updatedAt" FROM `Order`;--> statement-breakpoint
DROP TABLE `Order`;--> statement-breakpoint
ALTER TABLE `__new_Order` RENAME TO `Order`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `Visitor` ADD `address` text;--> statement-breakpoint
ALTER TABLE `Media` ADD `thumbnailMedium` text;--> statement-breakpoint
ALTER TABLE `Media` ADD `thumbnailLarge` text;--> statement-breakpoint
ALTER TABLE `Users` ADD `exhibitionEnabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `Users` ADD `exhibitionTitle` text;--> statement-breakpoint
ALTER TABLE `Users` ADD `exhibitionSubtitle` text;--> statement-breakpoint
ALTER TABLE `Users` ADD `exhibitionDescription` text;