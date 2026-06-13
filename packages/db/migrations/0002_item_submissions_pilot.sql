CREATE TABLE `item_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`directory_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`website_url` text NOT NULL,
	`submitter_visitor_id` text,
	`submitter_name` text,
	`submitter_email` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`merged_into_item_id` text,
	`moderator_note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`moderated_at` integer,
	FOREIGN KEY (`directory_id`) REFERENCES `directories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`merged_into_item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_submissions_dir_slug_active_idx` ON `item_submissions` (`directory_id`,`slug`);--> statement-breakpoint
CREATE INDEX `item_submissions_status_created_idx` ON `item_submissions` (`status`,`created_at`);
