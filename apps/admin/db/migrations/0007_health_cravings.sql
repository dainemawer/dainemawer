CREATE TABLE "health_cravings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"level" integer,
	"note" text
);
--> statement-breakpoint
CREATE INDEX "health_cravings_at_idx" ON "health_cravings" USING btree ("at");