ALTER TABLE "booking" ADD COLUMN "extends_booking_id" text;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_extends_booking_id_booking_id_fk" FOREIGN KEY ("extends_booking_id") REFERENCES "public"."booking"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_extendsBookingId_idx" ON "booking" USING btree ("extends_booking_id");