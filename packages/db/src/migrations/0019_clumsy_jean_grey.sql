ALTER TABLE "expense" ADD COLUMN "expense_date" date;--> statement-breakpoint
-- Existing rows predate the column, so they fall back to the day they were
-- written. That is the best available approximation of when the cost occurred,
-- and leaving them NULL would show a blank date on every historical expense.
UPDATE "expense" SET "expense_date" = "created_at"::date WHERE "expense_date" IS NULL;--> statement-breakpoint
CREATE INDEX "expense_hqOrganizationId_expenseDate_idx" ON "expense" USING btree ("hq_organization_id","expense_date");
