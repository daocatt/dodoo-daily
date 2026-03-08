CREATE TABLE `AssignedTask` (
	`id` text PRIMARY KEY NOT NULL,
	`assignerId` text,
	`assigneeId` text,
	`title` text NOT NULL,
	`description` text,
	`isRepeating` integer DEFAULT false NOT NULL,
	`isMonthlyRepeating` integer DEFAULT false NOT NULL,
	`rewardStars` integer DEFAULT 1 NOT NULL,
	`rewardCoins` integer DEFAULT 0 NOT NULL,
	`confirmationStatus` text DEFAULT 'PENDING',
	`plannedTime` integer,
	`completed` integer DEFAULT false NOT NULL,
	`completedById` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer,
	FOREIGN KEY (`assignerId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigneeId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completedById`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Task` (
	`id` text PRIMARY KEY NOT NULL,
	`creatorId` text,
	`title` text NOT NULL,
	`description` text,
	`isRepeating` integer DEFAULT false NOT NULL,
	`isMonthlyRepeating` integer DEFAULT false NOT NULL,
	`rewardStars` integer DEFAULT 1 NOT NULL,
	`rewardCoins` integer DEFAULT 0 NOT NULL,
	`plannedTime` integer,
	`completed` integer DEFAULT false NOT NULL,
	`completedById` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer,
	FOREIGN KEY (`creatorId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completedById`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Task`("id", "creatorId", "title", "description", "isRepeating", "isMonthlyRepeating", "rewardStars", "rewardCoins", "plannedTime", "completed", "completedById", "createdAt", "updatedAt") SELECT "id", "creatorId", "title", "description", "isRepeating", "isMonthlyRepeating", "rewardStars", "rewardCoins", "plannedTime", "completed", "completedById", "createdAt", "updatedAt" FROM `Task`;--> statement-breakpoint
DROP TABLE `Task`;--> statement-breakpoint
ALTER TABLE `__new_Task` RENAME TO `Task`;--> statement-breakpoint
PRAGMA foreign_keys=ON;