CREATE TABLE "health_days" (
	"date" date PRIMARY KEY NOT NULL,
	"weight_grams" integer,
	"steps" integer,
	"sleep_minutes" integer,
	"resting_hr" integer,
	"protein_meals" integer,
	"kitchen_closed" boolean,
	"worked_out" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
