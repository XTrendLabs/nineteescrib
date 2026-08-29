DROP INDEX "attendance_day_hqOrganizationId_date_uq";--> statement-breakpoint
--
-- The day marker becomes per staff member rather than per HQ. Existing rows
-- record only that *someone* took a given date, which cannot be attributed to
-- a person after the fact -- and keeping them would carry the very bug this
-- migration fixes, where one member's mark reports everyone else present.
--
-- They are expanded into one row per staff member who already has a record on
-- that date: those are the only attributions the data actually supports.
-- Everything else reverts to "unmarked", which is the honest state for a day
-- nobody was individually marked on.
--
ALTER TABLE "attendance_day" ADD COLUMN "staff_id" text;--> statement-breakpoint

INSERT INTO "attendance_day" ("id", "staff_id", "hq_organization_id", "date", "marked_by_user_id", "created_at", "updated_at")
SELECT gen_random_uuid()::text, r."staff_id", d."hq_organization_id", d."date", d."marked_by_user_id", d."created_at", d."updated_at"
FROM "attendance_day" d
JOIN "attendance_record" r
  ON r."date" = d."date" AND r."hq_organization_id" = d."hq_organization_id"
WHERE d."staff_id" IS NULL;--> statement-breakpoint

DELETE FROM "attendance_day" WHERE "staff_id" IS NULL;--> statement-breakpoint

ALTER TABLE "attendance_day" ALTER COLUMN "staff_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_day" ADD CONSTRAINT "attendance_day_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_day_staffId_date_uq" ON "attendance_day" USING btree ("staff_id","date");--> statement-breakpoint
CREATE INDEX "attendance_day_hqOrganizationId_date_idx" ON "attendance_day" USING btree ("hq_organization_id","date");
