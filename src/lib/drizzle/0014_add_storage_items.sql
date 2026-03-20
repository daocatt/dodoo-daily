CREATE TABLE `storageItems` (
	`id` text PRIMARY KEY NOT NULL,
	`creatorId` text,
	`name` text NOT NULL,
	`imageUrl` text NOT NULL,
	`notes` text,
	`tags` text DEFAULT '[]',
	`isDeleted` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer,
	FOREIGN KEY (`creatorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
