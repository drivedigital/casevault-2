CREATE TYPE "casevault2"."connector_status" AS ENUM('connected', 'disconnected', 'syncing', 'error');--> statement-breakpoint
CREATE TYPE "casevault2"."contact_type" AS ENUM('individual', 'organization', 'law_firm', 'court');--> statement-breakpoint
CREATE TYPE "casevault2"."deadline_status" AS ENUM('upcoming', 'completed', 'missed');--> statement-breakpoint
CREATE TYPE "casevault2"."docket_entry_status" AS ENUM('pending_review', 'indexed', 'verified');--> statement-breakpoint
CREATE TYPE "casevault2"."document_source_type" AS ENUM('docket_filing', 'drive', 'upload', 'email');--> statement-breakpoint
CREATE TYPE "casevault2"."document_status" AS ENUM('pending_review', 'processing', 'indexed', 'verified', 'flagged');--> statement-breakpoint
CREATE TYPE "casevault2"."polarity_type" AS ENUM('supporting', 'adverse', 'context');--> statement-breakpoint
CREATE TYPE "casevault2"."precision_type" AS ENUM('exact', 'range', 'approx', 'unknown');--> statement-breakpoint
CREATE TYPE "casevault2"."proposal_status" AS ENUM('proposed', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "casevault2"."proposal_type" AS ENUM('review_flag', 'entity_suggestion', 'summary', 'duplicate', 'alias_merge', 'concept_map');--> statement-breakpoint
CREATE TYPE "casevault2"."tag_type" AS ENUM('matter', 'party', 'concept');--> statement-breakpoint
CREATE TYPE "casevault2"."task_status" AS ENUM('open', 'in_progress', 'done');--> statement-breakpoint
CREATE TABLE "casevault2"."activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"category" varchar(64) DEFAULT 'system' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "casevault2"."ai_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer,
	"contact_id" integer,
	"type" "casevault2"."proposal_type" NOT NULL,
	"severity" varchar(32) DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"status" "casevault2"."proposal_status" DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "casevault2"."chronology_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"event_date" date,
	"precision" "casevault2"."precision_type" DEFAULT 'exact' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"document_id" integer,
	"page_cite" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "casevault2"."claim_elements" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "casevault2"."claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"title" text NOT NULL,
	"statute" varchar(256),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "casevault2"."contact_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"alias_name" text NOT NULL,
	"source" varchar(256),
	"confidence" real DEFAULT 0.8 NOT NULL,
	"resolved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "casevault2"."contact_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_contact_id" integer NOT NULL,
	"to_contact_id" integer NOT NULL,
	"relationship_type" varchar(128) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "casevault2"."contact_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"matter_id" integer,
	"capacity" varchar(128) NOT NULL,
	"role_label" varchar(128) NOT NULL,
	"side" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "casevault2"."contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "casevault2"."contact_type" DEFAULT 'individual' NOT NULL,
	"display_name" text NOT NULL,
	"external_id" text,
	"provenance" jsonb,
	"primary_email" varchar(256),
	"primary_phone" varchar(64),
	"notes" text,
	"avatar_color" varchar(32) DEFAULT '#6366f1',
	"is_canonical" boolean DEFAULT true NOT NULL,
	"merged_into_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "casevault2"."deadlines" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"title" text NOT NULL,
	"due_date" date NOT NULL,
	"type" varchar(128) NOT NULL,
	"status" "casevault2"."deadline_status" DEFAULT 'upcoming' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "casevault2"."docket_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"docket_id" integer NOT NULL,
	"sequence_number" integer NOT NULL,
	"external_id" text,
	"availability" text DEFAULT 'metadata_only' NOT NULL,
	"source_status" text,
	"source_url" text,
	"provenance" jsonb,
	"filed_date" date,
	"doc_type" varchar(256) NOT NULL,
	"description" text,
	"status" "casevault2"."docket_entry_status" DEFAULT 'pending_review' NOT NULL,
	"document_id" integer,
	CONSTRAINT "docket_entries_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "casevault2"."dockets" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer,
	"index_number" varchar(128) NOT NULL,
	"court" varchar(256) NOT NULL,
	"caption" text NOT NULL,
	"source_url" text,
	"external_id" text,
	"notebook_id" text,
	"status" varchar(64) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dockets_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "casevault2"."document_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"tag_type" "casevault2"."tag_type" NOT NULL,
	"tag_value" varchar(256) NOT NULL,
	"contact_id" integer,
	"matter_id" integer
);
--> statement-breakpoint
CREATE TABLE "casevault2"."documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer,
	"docket_id" integer,
	"title" text NOT NULL,
	"external_id" text,
	"object_key" text,
	"object_bucket" text,
	"provenance" jsonb,
	"file_name" varchar(512),
	"source_type" "casevault2"."document_source_type" DEFAULT 'upload' NOT NULL,
	"source_system" varchar(128),
	"status" "casevault2"."document_status" DEFAULT 'pending_review' NOT NULL,
	"sha256" varchar(64),
	"page_count" integer DEFAULT 1,
	"file_url" text,
	"ocr_text" text,
	"ai_summary" text,
	"key_concepts" jsonb DEFAULT '[]'::jsonb,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"filed_date" date,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "casevault2"."fact_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_element_id" integer NOT NULL,
	"chronology_event_id" integer,
	"document_id" integer,
	"polarity" "casevault2"."polarity_type" DEFAULT 'supporting' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "casevault2"."ingestion_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"document_id" integer,
	"kind" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_token" text,
	"lease_until" timestamp with time zone,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingestion_jobs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "casevault2"."matters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"case_number" varchar(128),
	"court" varchar(256),
	"status" varchar(64) DEFAULT 'active' NOT NULL,
	"description" text,
	"external_id" text,
	"provenance" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "matters_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "casevault2"."notebook_associations" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"document_id" integer,
	"notebook_id" text NOT NULL,
	"source_id" text NOT NULL,
	"artifact_hash" text,
	"status" text NOT NULL,
	"equivalence" text NOT NULL,
	"provenance" jsonb,
	CONSTRAINT "notebook_associations_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "casevault2"."source_connectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"kind" varchar(64) NOT NULL,
	"status" "casevault2"."connector_status" DEFAULT 'connected' NOT NULL,
	"detail" text,
	"last_sync_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "casevault2"."tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer,
	"title" text NOT NULL,
	"status" "casevault2"."task_status" DEFAULT 'open' NOT NULL,
	"due_date" date,
	"linked_document_id" integer
);
--> statement-breakpoint
ALTER TABLE "casevault2"."ai_proposals" ADD CONSTRAINT "ai_proposals_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "casevault2"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."ai_proposals" ADD CONSTRAINT "ai_proposals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "casevault2"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."chronology_events" ADD CONSTRAINT "chronology_events_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "casevault2"."matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."chronology_events" ADD CONSTRAINT "chronology_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "casevault2"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."claim_elements" ADD CONSTRAINT "claim_elements_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "casevault2"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."claims" ADD CONSTRAINT "claims_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "casevault2"."matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."contact_aliases" ADD CONSTRAINT "contact_aliases_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "casevault2"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."contact_relationships" ADD CONSTRAINT "contact_relationships_from_contact_id_contacts_id_fk" FOREIGN KEY ("from_contact_id") REFERENCES "casevault2"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."contact_relationships" ADD CONSTRAINT "contact_relationships_to_contact_id_contacts_id_fk" FOREIGN KEY ("to_contact_id") REFERENCES "casevault2"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."contact_roles" ADD CONSTRAINT "contact_roles_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "casevault2"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."contact_roles" ADD CONSTRAINT "contact_roles_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "casevault2"."matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."deadlines" ADD CONSTRAINT "deadlines_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "casevault2"."matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."docket_entries" ADD CONSTRAINT "docket_entries_docket_id_dockets_id_fk" FOREIGN KEY ("docket_id") REFERENCES "casevault2"."dockets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."docket_entries" ADD CONSTRAINT "docket_entries_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "casevault2"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."dockets" ADD CONSTRAINT "dockets_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "casevault2"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."document_tags" ADD CONSTRAINT "document_tags_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "casevault2"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."document_tags" ADD CONSTRAINT "document_tags_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "casevault2"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."document_tags" ADD CONSTRAINT "document_tags_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "casevault2"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."documents" ADD CONSTRAINT "documents_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "casevault2"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."documents" ADD CONSTRAINT "documents_docket_id_dockets_id_fk" FOREIGN KEY ("docket_id") REFERENCES "casevault2"."dockets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."fact_links" ADD CONSTRAINT "fact_links_claim_element_id_claim_elements_id_fk" FOREIGN KEY ("claim_element_id") REFERENCES "casevault2"."claim_elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."fact_links" ADD CONSTRAINT "fact_links_chronology_event_id_chronology_events_id_fk" FOREIGN KEY ("chronology_event_id") REFERENCES "casevault2"."chronology_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."fact_links" ADD CONSTRAINT "fact_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "casevault2"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "casevault2"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."notebook_associations" ADD CONSTRAINT "notebook_associations_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "casevault2"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."tasks" ADD CONSTRAINT "tasks_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "casevault2"."matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casevault2"."tasks" ADD CONSTRAINT "tasks_linked_document_id_documents_id_fk" FOREIGN KEY ("linked_document_id") REFERENCES "casevault2"."documents"("id") ON DELETE set null ON UPDATE no action;
-- Initial release: one private workspace, accessed only by a restricted server role.
-- Supabase Data API roles have no grants on this isolated schema.
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='casevault2' LOOP
  EXECUTE format('ALTER TABLE casevault2.%I ADD COLUMN workspace_id uuid NOT NULL DEFAULT %L',t.tablename,'b37e40d6-4746-490c-9b73-ea46e15e2b01');
  EXECUTE format('ALTER TABLE casevault2.%I ENABLE ROW LEVEL SECURITY',t.tablename);
  EXECUTE format('CREATE POLICY private_workspace ON casevault2.%I TO casevault2_app USING (workspace_id = %L::uuid) WITH CHECK (workspace_id = %L::uuid)',t.tablename,'b37e40d6-4746-490c-9b73-ea46e15e2b01','b37e40d6-4746-490c-9b73-ea46e15e2b01');
 END LOOP;
END $$;
GRANT USAGE ON SCHEMA casevault2 TO casevault2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA casevault2 TO casevault2_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA casevault2 TO casevault2_app;
REVOKE ALL ON SCHEMA casevault2 FROM anon, authenticated;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT conrelid::regclass AS tbl, a.attname AS col FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey) WHERE c.contype='f' AND c.connamespace='casevault2'::regnamespace LOOP
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%I)',replace(f.tbl::text,'casevault2.','')||'_'||f.col||'_idx',f.tbl,f.col);
 END LOOP;
END $$;
CREATE UNIQUE INDEX docket_entry_number_idx ON casevault2.docket_entries(docket_id,sequence_number);
CREATE UNIQUE INDEX connector_kind_idx ON casevault2.source_connectors(kind);
CREATE INDEX ingestion_jobs_status_idx ON casevault2.ingestion_jobs(status,created_at);
ALTER TABLE casevault2.ingestion_jobs ADD CONSTRAINT valid_job_status CHECK (status IN ('queued','running','needs_human','succeeded','partial','failed','cancelled'));
