CREATE TABLE `prompt_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`original_prompt` text NOT NULL,
	`evaluation_result` text,
	`optimized_prompt` text NOT NULL,
	`evaluate_model_id` text,
	`optimize_model_id` text NOT NULL,
	`evaluate_params` text,
	`optimize_params` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`evaluate_model_id`) REFERENCES `ai_models`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`optimize_model_id`) REFERENCES `ai_models`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `prompt_runs_created_at_idx` ON `prompt_runs` (`created_at`);--> statement-breakpoint
CREATE TABLE `saved_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_run_id` text NOT NULL,
	`optimized_prompt` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`prompt_run_id`) REFERENCES `prompt_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_prompts_prompt_run_id_unique` ON `saved_prompts` (`prompt_run_id`);--> statement-breakpoint
CREATE INDEX `saved_prompts_created_at_id_idx` ON `saved_prompts` (`created_at`,`id`);