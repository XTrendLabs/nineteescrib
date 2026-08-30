CREATE TABLE "vendor" (
	"id" text PRIMARY KEY NOT NULL,
	"hq_organization_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"email" text,
	"category" text DEFAULT 'other' NOT NULL,
	"gstin" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendor_hqOrganizationId_idx" ON "vendor" USING btree ("hq_organization_id");--> statement-breakpoint
CREATE INDEX "vendor_hqOrganizationId_category_idx" ON "vendor" USING btree ("hq_organization_id","category");