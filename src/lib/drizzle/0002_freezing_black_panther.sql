DROP TABLE `AssignedTask`;--> statement-breakpoint
ALTER TABLE `Task` ADD `assignerId` text REFERENCES Users(id);--> statement-breakpoint
ALTER TABLE `Task` ADD `assigneeId` text REFERENCES Users(id);--> statement-breakpoint
ALTER TABLE `Task` ADD `confirmationStatus` text;