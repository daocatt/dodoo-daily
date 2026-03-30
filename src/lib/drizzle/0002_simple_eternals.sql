CREATE TABLE `storageCategory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emoji` text,
	`creatorId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`creatorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
