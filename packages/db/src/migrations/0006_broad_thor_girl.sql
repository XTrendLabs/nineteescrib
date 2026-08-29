CREATE TABLE "attendance_day" (
	"id" text PRIMARY KEY NOT NULL,
	"hq_organization_id" text NOT NULL,
	"date" date NOT NULL,
	"marked_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_record" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"hq_organization_id" text NOT NULL,
	"organization_id" text,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"marked_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_day" ADD CONSTRAINT "attendance_day_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_day" ADD CONSTRAINT "attendance_day_marked_by_user_id_user_id_fk" FOREIGN KEY ("marked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_marked_by_user_id_user_id_fk" FOREIGN KEY ("marked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_day_hqOrganizationId_date_uq" ON "attendance_day" USING btree ("hq_organization_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_record_staffId_date_uq" ON "attendance_record" USING btree ("staff_id","date");--> statement-breakpoint
CREATE INDEX "attendance_record_hqOrganizationId_date_idx" ON "attendance_record" USING btree ("hq_organization_id","date");