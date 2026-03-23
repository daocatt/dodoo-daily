CREATE TABLE `ArtworkLike` (
	`id` text PRIMARY KEY NOT NULL,
	`artworkId` text NOT NULL,
	`visitorId` text,
	`memberId` text,
	`ip` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`artworkId`) REFERENCES `Artwork`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`memberId`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
