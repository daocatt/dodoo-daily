CREATE TABLE `IpBlacklist` (
	`id` text PRIMARY KEY NOT NULL,
	`ip` text NOT NULL,
	`reason` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `IpBlacklist_ip_unique` ON `IpBlacklist` (`ip`);--> statement-breakpoint
ALTER TABLE `Artwork` ADD `isApproved` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Visitor` ADD `email` text;--> statement-breakpoint
ALTER TABLE `Visitor` ADD `status` text DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE `Visitor` ADD `lastIp` text;--> statement-breakpoint
ALTER TABLE `SystemSettings` ADD `systemSubtitle` text;--> statement-breakpoint
ALTER TABLE `SystemSettings` ADD `requireVisitorApproval` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `SystemSettings` ADD `requireInvitationCode` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `SystemSettings` ADD `visitorInvitationCode` text;