CREATE TABLE `lab_announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lab_session_id` integer NOT NULL,
	`message` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lab_chats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lab_session_id` integer NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lab_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lab_session_id` integer NOT NULL,
	`student_id` text NOT NULL,
	`file_name` text NOT NULL,
	`language` text NOT NULL,
	`code` text NOT NULL,
	`last_updated` text NOT NULL,
	FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lab_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lab_session_id` integer NOT NULL,
	`student_id` text NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lab_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_code` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`teacher_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lab_sessions_session_code_unique` ON `lab_sessions` (`session_code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);