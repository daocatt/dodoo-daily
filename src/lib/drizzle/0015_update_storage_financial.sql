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
ALTER TABLE `storageItems` ADD `purchasePrice` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `storageItems` ADD `resalePrice` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `storageItems` ADD `purchaseDate` integer;--> statement-breakpoint
ALTER TABLE `storageItems` ADD `isForSale` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `storageItems` ADD `isSynced` integer DEFAULT false NOT NULL;