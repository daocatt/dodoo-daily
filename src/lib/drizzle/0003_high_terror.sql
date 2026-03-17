CREATE TABLE `PushSubscription` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`deviceType` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PushSubscription_endpoint_unique` ON `PushSubscription` (`endpoint`);