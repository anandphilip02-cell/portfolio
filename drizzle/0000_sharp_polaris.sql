CREATE TABLE `portfolio_works` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`client` text NOT NULL,
	`year` text NOT NULL,
	`copy` text NOT NULL,
	`result` text NOT NULL,
	`class_name` text NOT NULL,
	`video_url` text,
	`image_key` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_portfolio_works_created_at` ON `portfolio_works` (`created_at`);