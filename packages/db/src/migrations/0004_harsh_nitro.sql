CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_details" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"property_type" text DEFAULT 'other' NOT NULL,
	"address_line1" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"country" text DEFAULT 'India' NOT NULL,
	"cover_image" text,
	"status" text DEFAULT 'active' NOT NULL,
	"owner_name" text,
	"contact_phone" text,
	"contact_email" text,
	"whatsapp_number" text,
	"operations_open_time" text,
	"operations_close_time" text,
	"invoice_prefix" text,
	"gst_number" text,
	"pan_number" text,
	"billing_address" text,
	"bank_account_holder_name" text,
	"bank_account_number" text,
	"bank_ifsc_code" text,
	"bank_name" text,
	"check_in_time" text,
	"check_out_time" text,
	"min_stay_nights" integer,
	"max_stay_nights" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amenity" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"room_number" text,
	"floor" text,
	"room_type" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"weekday_price" integer DEFAULT 0 NOT NULL,
	"weekend_price" integer DEFAULT 0 NOT NULL,
	"max_guests" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_amenity" (
	"room_id" text NOT NULL,
	"amenity_id" text NOT NULL,
	CONSTRAINT "room_amenity_room_id_amenity_id_pk" PRIMARY KEY("room_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "room_image" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"hq_organization_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'caretaker' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"photo_url" text,
	"date_of_birth" text,
	"gender" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"pin_code" text,
	"emergency_name" text,
	"emergency_phone" text,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_property" (
	"staff_id" text NOT NULL,
	"organization_id" text NOT NULL,
	CONSTRAINT "staff_property_staff_id_organization_id_pk" PRIMARY KEY("staff_id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "property" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "room_type" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "property" CASCADE;--> statement-breakpoint
DROP TABLE "room_type" CASCADE;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "kind" text DEFAULT 'property' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "parent_organization_id" text;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_details" ADD CONSTRAINT "property_details_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_rule" ADD CONSTRAINT "property_rule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_amenity" ADD CONSTRAINT "room_amenity_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_amenity" ADD CONSTRAINT "room_amenity_amenity_id_amenity_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_image" ADD CONSTRAINT "room_image_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_property" ADD CONSTRAINT "staff_property_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_property" ADD CONSTRAINT "staff_property_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_organizationId_idx" ON "team" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_member_teamId_idx" ON "team_member" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_member_userId_idx" ON "team_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "property_details_status_idx" ON "property_details" USING btree ("status");--> statement-breakpoint
CREATE INDEX "property_rule_organizationId_idx" ON "property_rule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "property_rule_organizationId_category_idx" ON "property_rule" USING btree ("organization_id","category");--> statement-breakpoint
CREATE INDEX "room_organizationId_idx" ON "room" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "room_amenity_roomId_idx" ON "room_amenity" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_amenity_amenityId_idx" ON "room_amenity" USING btree ("amenity_id");--> statement-breakpoint
CREATE INDEX "room_image_roomId_idx" ON "room_image" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "staff_hqOrganizationId_idx" ON "staff" USING btree ("hq_organization_id");--> statement-breakpoint
CREATE INDEX "staff_property_staffId_idx" ON "staff_property" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_property_organizationId_idx" ON "staff_property" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_parent_organization_id_organization_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_parentOrganizationId_idx" ON "organization" USING btree ("parent_organization_id");--> statement-breakpoint
CREATE INDEX "organization_kind_idx" ON "organization" USING btree ("kind");