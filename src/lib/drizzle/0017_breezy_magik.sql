CREATE TABLE `JournalMedia` (
	`id` text PRIMARY KEY NOT NULL,
	`journalId` text NOT NULL,
	`type` text DEFAULT 'IMAGE' NOT NULL,
	`url` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`journalId`) REFERENCES `Journal`(`id`) ON UPDATE no action ON DELETE cascade
);
