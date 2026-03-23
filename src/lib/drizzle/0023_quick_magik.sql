ALTER TABLE `Users` ADD `isLocked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Users` ADD `permissionRole` text DEFAULT 'USER' NOT NULL;