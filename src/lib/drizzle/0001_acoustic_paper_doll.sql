ALTER TABLE `Task` ADD `isMonthlyRepeating` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Task` ADD `plannedTime` integer;--> statement-breakpoint
ALTER TABLE `Users` ADD `chineseZodiac` text;