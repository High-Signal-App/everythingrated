CREATE TABLE `item_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_tags_item_key_value_idx` ON `item_tags` (`item_id`,`key`,`value`);
--> statement-breakpoint
CREATE INDEX `item_tags_key_value_idx` ON `item_tags` (`key`,`value`);
