CREATE TABLE "expense" (
	"id" text PRIMARY KEY NOT NULL,
	"hq_organization_id" text NOT NULL,
	"organization_id" text,
	"ref" text NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"vendor_id" text,
	"total_amount_paise" bigint NOT NULL,
	"due_date" date,
	"is_owner_deductible" boolean DEFAULT false NOT NULL,
	"tax_amount_paise" bigint DEFAULT 0 NOT NULL,
	"vendor_gstin" text,
	"itc_claimable" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_counter" (
	"hq_organization_id" text PRIMARY KEY NOT NULL,
	"last_ref" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"amount_paise" bigint NOT NULL,
	"method" text DEFAULT 'upi' NOT NULL,
	"paid_at" date NOT NULL,
	"reference_id" text,
	"notes" text,
	"recorded_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_counter" ADD CONSTRAINT "expense_counter_hq_organization_id_organization_id_fk" FOREIGN KEY ("hq_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_payment" ADD CONSTRAINT "expense_payment_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_payment" ADD CONSTRAINT "expense_payment_recorded_by_user_id_user_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "expense_hqOrganizationId_ref_uq" ON "expense" USING btree ("hq_organization_id","ref");--> statement-breakpoint
CREATE INDEX "expense_hqOrganizationId_createdAt_idx" ON "expense" USING btree ("hq_organization_id","created_at");--> statement-breakpoint
CREATE INDEX "expense_organizationId_idx" ON "expense" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "expense_vendorId_idx" ON "expense" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "expense_payment_expenseId_idx" ON "expense_payment" USING btree ("expense_id");