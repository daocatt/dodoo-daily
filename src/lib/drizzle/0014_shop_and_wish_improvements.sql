-- ShopItem: soft-delete flag
ALTER TABLE `ShopItem` ADD `isDeleted` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

-- Purchase: item snapshot fields (preserve name/icon/desc even if item is later deleted)
ALTER TABLE `Purchase` ADD `itemName` text;
--> statement-breakpoint
ALTER TABLE `Purchase` ADD `itemIconUrl` text;
--> statement-breakpoint
ALTER TABLE `Purchase` ADD `itemDescription` text;
--> statement-breakpoint

-- Wish: track when (and if) a wish was added to the shop (prevents duplicate adds)
ALTER TABLE `Wish` ADD `addedToShopAt` integer;
