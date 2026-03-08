ALTER TABLE `SystemSettings` ADD `starsToCoinsRatio` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `SystemSettings` ADD `coinsToRmbRatio` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `Task` ADD `rewardCoins` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `Task` ADD `needsParentConfirmation` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Task` ADD `confirmationStatus` text DEFAULT 'PENDING';