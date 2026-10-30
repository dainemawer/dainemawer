CREATE TABLE "expense_subscriptions" (
	"key" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'tracking' NOT NULL,
	"notified_minor" bigint,
	"cancelled_on" date,
	"alerted_charge_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
