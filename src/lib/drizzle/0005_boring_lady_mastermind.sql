CREATE TABLE `GrowthRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`height` real,
	`weight` real,
	`date` integer NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `Users` ADD `lastLoginAt` integer;