CREATE TABLE "briefing_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"text" text NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "briefing_notes_unsent_idx" ON "briefing_notes" USING btree ("at") WHERE "briefing_notes"."sent_at" is null;