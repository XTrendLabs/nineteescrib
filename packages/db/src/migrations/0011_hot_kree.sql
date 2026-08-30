ALTER TABLE "expense" ADD COLUMN "gst_rate_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "gst_mode" text DEFAULT 'exclusive' NOT NULL;