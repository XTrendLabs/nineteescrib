CREATE TABLE "guest_note" (
	"id" text PRIMARY KEY NOT NULL,
	"guest_id" text NOT NULL,
	"text" text NOT NULL,
	"author_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_tag" (
	"guest_id" text NOT NULL,
	"tag" text NOT NULL,
	"tagged_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guest_tag_guest_id_tag_pk" PRIMARY KEY("guest_id","tag")
);
--> statement-breakpoint
ALTER TABLE "guest_note" ADD CONSTRAINT "guest_note_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_note" ADD CONSTRAINT "guest_note_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_tag" ADD CONSTRAINT "guest_tag_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_tag" ADD CONSTRAINT "guest_tag_tagged_by_user_id_user_id_fk" FOREIGN KEY ("tagged_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_note_guestId_createdAt_idx" ON "guest_note" USING btree ("guest_id","created_at");--> statement-breakpoint
CREATE INDEX "guest_tag_guestId_idx" ON "guest_tag" USING btree ("guest_id");