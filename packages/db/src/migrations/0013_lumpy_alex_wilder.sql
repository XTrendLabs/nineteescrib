CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"hq_organization_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"room_id" text NOT NULL,
	"ref" text NOT NULL,
	"kind" text DEFAULT 'reservation' NOT NULL,
	"block_reason" text,
	"guest_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"total_amount_paise" bigint DEFAULT 0 NOT NULL,
	"hold_expires_at" timestamp,
	"notes" text,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"actor_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_counter" (
	"hq_organization_id" text PRIMARY KEY NOT NULL,
	"last_ref" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"amount_paise" bigint NOT NULL,
	"method" text DEFAULT 'upi' NOT NULL,
	"paid_at" date NOT NULL,
	"reference_id" text,
	"notes" text,
	"recorded_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest" (
	"id" text PRIMARY KEY NOT NULL,
	"hq_organization_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_audit" ADD CONSTRAINT "booking_audit_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_audit" ADD CONSTRAINT "booking_audit_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_counter" ADD CONSTRAINT "booking_counter_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_payment" ADD CONSTRAINT "booking_payment_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_payment" ADD CONSTRAINT "booking_payment_recorded_by_user_id_user_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest" ADD CONSTRAINT "guest_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_hqOrganizationId_ref_uq" ON "booking" USING btree ("hq_organization_id","ref");--> statement-breakpoint
CREATE INDEX "booking_hqOrganizationId_checkIn_idx" ON "booking" USING btree ("hq_organization_id","check_in");--> statement-breakpoint
CREATE INDEX "booking_roomId_checkIn_checkOut_idx" ON "booking" USING btree ("room_id","check_in","check_out");--> statement-breakpoint
CREATE INDEX "booking_organizationId_idx" ON "booking" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "booking_guestId_idx" ON "booking" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "booking_audit_bookingId_createdAt_idx" ON "booking_audit" USING btree ("booking_id","created_at");--> statement-breakpoint
CREATE INDEX "booking_payment_bookingId_idx" ON "booking_payment" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_hqOrganizationId_phone_uq" ON "guest" USING btree ("hq_organization_id","phone");--> statement-breakpoint
CREATE INDEX "guest_hqOrganizationId_idx" ON "guest" USING btree ("hq_organization_id");