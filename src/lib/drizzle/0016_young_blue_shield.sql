CREATE TABLE `MemberLoginLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`ip` text,
	`userAgent` text,
	`status` text DEFAULT 'SUCCESS' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
