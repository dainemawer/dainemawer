CREATE TABLE "assistant_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"update_id" bigint,
	CONSTRAINT "assistant_messages_updateId_unique" UNIQUE("update_id")
);
--> statement-breakpoint
CREATE INDEX "assistant_messages_at_idx" ON "assistant_messages" USING btree ("at");