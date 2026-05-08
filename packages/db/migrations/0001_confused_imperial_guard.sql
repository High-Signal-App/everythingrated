CREATE TABLE `directory_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`hero_copy` text NOT NULL,
	`aspect_labels` text NOT NULL,
	`submitter_name` text,
	`submitter_email` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`moderator_note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`moderated_at` integer
);
--> statement-breakpoint
CREATE INDEX `directory_submissions_status_created_idx` ON `directory_submissions` (`status`,`created_at`);