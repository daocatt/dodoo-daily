PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_GuestMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`guestId` text,
	`memberId` text,
	`targetUserId` text NOT NULL,
	`text` text NOT NULL,
	`isPublic` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`guestId`) REFERENCES `Guest`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`targetUserId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_GuestMessage`("id", "guestId", "memberId", "targetUserId", "text", "isPublic", "createdAt") SELECT "id", "guestId", "memberId", "targetUserId", "text", "isPublic", "createdAt" FROM `GuestMessage`;--> statement-breakpoint
DROP TABLE `GuestMessage`;--> statement-breakpoint
ALTER TABLE `__new_GuestMessage` RENAME TO `GuestMessage`;--> statement-breakpoint
PRAGMA foreign_keys=ON;