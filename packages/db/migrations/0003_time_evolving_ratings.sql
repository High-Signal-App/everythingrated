CREATE TABLE `item_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`version` text NOT NULL,
	`released_at` integer NOT NULL,
	`note` text,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_versions_item_version_idx` ON `item_versions` (`item_id`,`version`);
--> statement-breakpoint
CREATE INDEX `item_versions_item_released_idx` ON `item_versions` (`item_id`,`released_at`);
--> statement-breakpoint
ALTER TABLE `ratings` ADD `version_id` text REFERENCES `item_versions`(`id`) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `ratings` ADD `superseded_at` integer;
--> statement-breakpoint
DROP INDEX IF EXISTS `ratings_item_aspect_visitor_idx`;
--> statement-breakpoint
CREATE INDEX `ratings_item_time_idx` ON `ratings` (`item_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `ratings_item_aspect_time_idx` ON `ratings` (`item_id`,`aspect_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `ratings_visitor_idx` ON `ratings` (`visitor_id`,`item_id`,`aspect_id`);
