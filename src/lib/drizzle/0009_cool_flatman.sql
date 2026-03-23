PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Order` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`visitorId` text NOT NULL,
	`amountRMB` real DEFAULT 0 NOT NULL,
	`amountCoins` integer DEFAULT 0 NOT NULL,
	`paymentType` text DEFAULT 'COINS' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`qrCodeUrl` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`artworkId`) REFERENCES `Artwork`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Order`("id", "artworkId", "visitorId", "amountRMB", "status", "qrCodeUrl", "createdAt", "updatedAt") SELECT "id", "artworkId", "visitorId", "amountRMB", "status", "qrCodeUrl", "createdAt", "updatedAt" FROM `Order`;--> statement-breakpoint
DROP TABLE `Order`;--> statement-breakpoint
ALTER TABLE `__new_Order` RENAME TO `Order`;--> statement-breakpoint
PRAGMA foreign_keys=ON;