ALTER TABLE `Guest` ADD `locale` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `SystemSettings` ADD `defaultLocale` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `Users` ADD `locale` text DEFAULT 'en' NOT NULL;