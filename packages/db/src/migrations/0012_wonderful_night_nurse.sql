CREATE TABLE "expense_receipt" (
	"id" text PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"url" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"uploaded_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_receipt" ADD CONSTRAINT "expense_receipt_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipt" ADD CONSTRAINT "expense_receipt_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_receipt_expenseId_idx" ON "expense_receipt" USING btree ("expense_id");