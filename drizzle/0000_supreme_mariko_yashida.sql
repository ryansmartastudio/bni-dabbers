CREATE TYPE "public"."member_status" AS ENUM('active', 'on_leave', 'former');--> statement-breakpoint
CREATE TYPE "public"."role_group" AS ENUM('leadership', 'support', 'committee', 'none');--> statement-breakpoint
CREATE TABLE "chapter_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_name" text DEFAULT 'BNI Dabbers' NOT NULL,
	"website_url" text DEFAULT 'www.bni-ce.co.uk/cheshire-east-dabbers' NOT NULL,
	"venue_name" text DEFAULT 'Wychwood Park Hotel & Golf Club' NOT NULL,
	"venue_address" text DEFAULT 'Weston, Crewe. CW2 5GP' NOT NULL,
	"meeting_day" text DEFAULT 'Thursday' NOT NULL,
	"meeting_start" text DEFAULT '06:45' NOT NULL,
	"meeting_end" text DEFAULT '08:30' NOT NULL,
	"presentation_slot" text,
	"education_slot" text,
	"training_events" text,
	"charity_name" text DEFAULT 'Genie''s Wish' NOT NULL,
	"charity_paragraph" text,
	"charity_logo_url" text,
	"bni_dabbers_bank_details" text,
	"bni_global_bank_details" text,
	"guest_page_count" integer DEFAULT 2 NOT NULL,
	"chapter_logo_url" text,
	"extras" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company" text NOT NULL,
	"bni_seat" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"linkedin_url" text,
	"headshot_url" text,
	"chapter_role" text,
	"role_group" "role_group" DEFAULT 'none' NOT NULL,
	"notes" text,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
