CREATE TABLE `JournalComment` (
	`id` text PRIMARY KEY NOT NULL,
	`journalId` text NOT NULL,
	`visitorId` text,
	`memberId` text,
	`authorName` text,
	`text` text NOT NULL,
	`isApproved` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`journalId`) REFERENCES `Journal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `Journal` ADD `isPublic` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Journal` ADD `isDeleted` integer DEFAULT false NOT NULL;