CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"paid_at" date NOT NULL,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "paid_minor" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_document_idx" ON "payments" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");--> statement-breakpoint
-- Every invoice already marked paid becomes one payment of its total.
INSERT INTO "payments" ("document_id", "amount_minor", "paid_at", "reference")
SELECT "id", "total_minor", "paid_at", "payment_ref" FROM "documents"
WHERE "kind" = 'invoice' AND "status" = 'paid' AND "paid_at" IS NOT NULL;
--> statement-breakpoint
UPDATE "documents" SET "paid_minor" = "total_minor"
WHERE "kind" = 'invoice' AND "status" = 'paid' AND "paid_at" IS NOT NULL;
