CREATE TABLE "recurring_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"interval" text NOT NULL,
	"anchor_day" integer NOT NULL,
	"next_issue_date" date NOT NULL,
	"end_date" date,
	"paused_at" timestamp with time zone,
	"title" text,
	"notes" text,
	"terms" text,
	"discount_minor" bigint DEFAULT 0 NOT NULL,
	"tax_rate_bp" integer DEFAULT 0 NOT NULL,
	"total_minor" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurring_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"description" text NOT NULL,
	"quantity_hundredths" integer NOT NULL,
	"unit_price_minor" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "recurring_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "recurring_date" date;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_lines" ADD CONSTRAINT "recurring_lines_recurring_id_recurring_invoices_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_invoices_next_idx" ON "recurring_invoices" USING btree ("next_issue_date");--> statement-breakpoint
CREATE INDEX "recurring_lines_recurring_idx" ON "recurring_lines" USING btree ("recurring_id","position");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_recurring_id_recurring_invoices_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "documents_recurring_date_idx" ON "documents" USING btree ("recurring_id","recurring_date") WHERE "documents"."recurring_id" is not null;