ALTER TABLE `SystemSettings` ADD `systemName` text DEFAULT 'DoDoo Family' NOT NULL;--> statement-breakpoint
ALTER TABLE `SystemSettings` ADD `showAllAvatars` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `SystemSettings` ADD `homepageImages` text;