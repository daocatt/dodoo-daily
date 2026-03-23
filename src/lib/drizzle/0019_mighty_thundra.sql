PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_VisitorMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`visitorId` text,
	`memberId` text,
	`targetUserId` text NOT NULL,
	`text` text NOT NULL,
	`isPublic` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`targetUserId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_VisitorMessage`("id", "visitorId", "memberId", "targetUserId", "text", "isPublic", "createdAt") SELECT "id", "visitorId", "memberId", "targetUserId", "text", "isPublic", "createdAt" FROM `VisitorMessage`;--> statement-breakpoint
DROP TABLE `VisitorMessage`;--> statement-breakpoint
ALTER TABLE `__new_VisitorMessage` RENAME TO `VisitorMessage`;--> statement-breakpoint
PRAGMA foreign_keys=ON;