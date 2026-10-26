CREATE TABLE "expense_accounts" (
	"account_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"product_name" text NOT NULL,
	"included" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "expense_labels" (
	"transaction_id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"category_id" uuid NOT NULL,
	"deductible" boolean DEFAULT false NOT NULL,
	"source" text NOT NULL,
	"confidence" real,
	"needs_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_monthly" (
	"month" date NOT NULL,
	"category_id" uuid NOT NULL,
	"out_minor" bigint DEFAULT 0 NOT NULL,
	"in_minor" bigint DEFAULT 0 NOT NULL,
	"deductible_out_minor" bigint DEFAULT 0 NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_monthly_month_category_id_pk" PRIMARY KEY("month","category_id")
);
--> statement-breakpoint
CREATE TABLE "expense_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern" text NOT NULL,
	"category_id" uuid NOT NULL,
	"deductible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_rules_pattern_unique" UNIQUE("pattern")
);
--> statement-breakpoint
ALTER TABLE "expense_labels" ADD CONSTRAINT "expense_labels_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_monthly" ADD CONSTRAINT "expense_monthly_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_rules" ADD CONSTRAINT "expense_rules_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_labels_review_idx" ON "expense_labels" USING btree ("needs_review") WHERE "expense_labels"."needs_review";