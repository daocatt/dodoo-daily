ALTER TABLE `Album` ADD `isPublic` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Users` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `Users_slug_unique` ON `Users` (`slug`);