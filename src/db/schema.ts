import {
  pgSchema,
  uuid,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  real,
  date,
} from "drizzle-orm/pg-core";

const cv = pgSchema("casevault2");
const pgTable = cv.table.bind(cv);
const pgEnum = cv.enum.bind(cv);

// ---------- ENUMS ----------
export const contactTypeEnum = pgEnum("contact_type", [
  "individual",
  "organization",
  "law_firm",
  "court",
]);

export const documentSourceTypeEnum = pgEnum("document_source_type", [
  "docket_filing",
  "drive",
  "upload",
  "email",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending_review",
  "processing",
  "indexed",
  "verified",
  "flagged",
]);

export const tagTypeEnum = pgEnum("tag_type", ["matter", "party", "concept"]);

export const proposalTypeEnum = pgEnum("proposal_type", [
  "review_flag",
  "entity_suggestion",
  "summary",
  "duplicate",
  "alias_merge",
  "concept_map",
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "proposed",
  "accepted",
  "rejected",
]);

export const precisionEnum = pgEnum("precision_type", [
  "exact",
  "range",
  "approx",
  "unknown",
]);

export const polarityEnum = pgEnum("polarity_type", [
  "supporting",
  "adverse",
  "context",
]);

// ---------- CLAIMS MATRIX ----------
export const proofStrengthEnum = pgEnum("proof_strength", [
  "strong",
  "moderate",
  "weak",
  "gap",
]);

export const elementStatusEnum = pgEnum("element_status", [
  "unreviewed",
  "in_progress",
  "supported",
  "disputed",
  "gap",
]);

export const evidenceKindEnum = pgEnum("evidence_kind", [
  "document",
  "testimony",
  "chronology",
  "note",
]);

export const linkReviewStateEnum = pgEnum("link_review_state", [
  "proposed",
  "accepted",
  "rejected",
]);

export const witnessTypeEnum = pgEnum("witness_type", [
  "fact",
  "expert",
  "adverse",
  "party",
  "custodian",
]);

export const deadlineStatusEnum = pgEnum("deadline_status", [
  "upcoming",
  "completed",
  "missed",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "done",
]);

export const docketEntryStatusEnum = pgEnum("docket_entry_status", [
  "pending_review",
  "indexed",
  "verified",
]);

export const connectorStatusEnum = pgEnum("connector_status", [
  "connected",
  "disconnected",
  "syncing",
  "error",
]);

// ---------- CORE: MATTERS ----------
export const matters = pgTable("matters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  caseNumber: varchar("case_number", { length: 128 }),
  court: varchar("court", { length: 256 }),
  status: varchar("status", { length: 64 }).notNull().default("active"),
  description: text("description"),
  externalId: text("external_id").unique(),
  provenance: jsonb("provenance").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- CONVERGE: CONTACTS / IDENTITY ----------
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  type: contactTypeEnum("type").notNull().default("individual"),
  displayName: text("display_name").notNull(),
  externalId: text("external_id").unique(),
  provenance: jsonb("provenance").$type<Record<string, unknown>>(),
  primaryEmail: varchar("primary_email", { length: 256 }),
  primaryPhone: varchar("primary_phone", { length: 64 }),
  notes: text("notes"),
  avatarColor: varchar("avatar_color", { length: 32 }).default("#6366f1"),
  isCanonical: boolean("is_canonical").notNull().default(true),
  mergedIntoId: integer("merged_into_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactAliases = pgTable("contact_aliases", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  aliasName: text("alias_name").notNull(),
  source: varchar("source", { length: 256 }),
  confidence: real("confidence").notNull().default(0.8),
  resolved: boolean("resolved").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactRoles = pgTable("contact_roles", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  matterId: integer("matter_id").references(() => matters.id, {
    onDelete: "cascade",
  }),
  capacity: varchar("capacity", { length: 128 }).notNull(),
  roleLabel: varchar("role_label", { length: 128 }).notNull(),
  side: varchar("side", { length: 64 }),
});

export const contactRelationships = pgTable("contact_relationships", {
  id: serial("id").primaryKey(),
  fromContactId: integer("from_contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  toContactId: integer("to_contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationship_type", { length: 128 }).notNull(),
  notes: text("notes"),
});

// ---------- DOCKET-KEY ----------
export const sourceConnectors = pgTable("source_connectors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  kind: varchar("kind", { length: 64 }).notNull(),
  status: connectorStatusEnum("status").notNull().default("connected"),
  detail: text("detail"),
  lastSyncAt: timestamp("last_sync_at"),
});

export const dockets = pgTable("dockets", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").references(() => matters.id, {
    onDelete: "set null",
  }),
  indexNumber: varchar("index_number", { length: 128 }).notNull(),
  court: varchar("court", { length: 256 }).notNull(),
  caption: text("caption").notNull(),
  sourceUrl: text("source_url"),
  externalId: text("external_id").unique(),
  notebookId: text("notebook_id"),
  status: varchar("status", { length: 64 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").references(() => matters.id, {
    onDelete: "set null",
  }),
  docketId: integer("docket_id").references(() => dockets.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  externalId: text("external_id").unique(),
  objectKey: text("object_key"),
  objectBucket: text("object_bucket"),
  provenance: jsonb("provenance").$type<Record<string, unknown>>(),
  fileName: varchar("file_name", { length: 512 }),
  sourceType: documentSourceTypeEnum("source_type").notNull().default("upload"),
  sourceSystem: varchar("source_system", { length: 128 }),
  status: documentStatusEnum("status").notNull().default("pending_review"),
  sha256: varchar("sha256", { length: 64 }),
  pageCount: integer("page_count").default(1),
  fileUrl: text("file_url"),
  ocrText: text("ocr_text"),
  aiSummary: text("ai_summary"),
  keyConcepts: jsonb("key_concepts").$type<string[]>().default([]),
  isFlagged: boolean("is_flagged").notNull().default(false),
  flagReason: text("flag_reason"),
  filedDate: date("filed_date"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const docketEntries = pgTable("docket_entries", {
  id: serial("id").primaryKey(),
  docketId: integer("docket_id")
    .notNull()
    .references(() => dockets.id, { onDelete: "cascade" }),
  sequenceNumber: integer("sequence_number").notNull(),
  externalId: text("external_id").unique(),
  availability: text("availability").notNull().default("metadata_only"),
  sourceStatus: text("source_status"),
  sourceUrl: text("source_url"),
  provenance: jsonb("provenance").$type<Record<string, unknown>>(),
  filedDate: date("filed_date"),
  docType: varchar("doc_type", { length: 256 }).notNull(),
  description: text("description"),
  status: docketEntryStatusEnum("status").notNull().default("pending_review"),
  documentId: integer("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
});

export const documentTags = pgTable("document_tags", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  tagType: tagTypeEnum("tag_type").notNull(),
  tagValue: varchar("tag_value", { length: 256 }).notNull(),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  matterId: integer("matter_id").references(() => matters.id, {
    onDelete: "set null",
  }),
});

export const aiProposals = pgTable("ai_proposals", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, {
    onDelete: "cascade",
  }),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "cascade",
  }),
  type: proposalTypeEnum("type").notNull(),
  severity: varchar("severity", { length: 32 }).notNull().default("medium"),
  title: text("title").notNull(),
  description: text("description"),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  status: proposalStatusEnum("status").notNull().default("proposed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- CASEVAULT CORE ----------
export const chronologyEvents = pgTable("chronology_events", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id")
    .notNull()
    .references(() => matters.id, { onDelete: "cascade" }),
  eventDate: date("event_date"),
  precision: precisionEnum("precision").notNull().default("exact"),
  title: text("title").notNull(),
  description: text("description"),
  documentId: integer("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
  pageCite: varchar("page_cite", { length: 64 }),
});

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id")
    .notNull()
    .references(() => matters.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  statute: varchar("statute", { length: 256 }),
  description: text("description"),
  chartType: varchar("chart_type", { length: 48 }).notNull().default("civil-element"),
  causeOfAction: text("cause_of_action"),
  jurisdiction: varchar("jurisdiction", { length: 128 }),
  burdenOfProof: varchar("burden_of_proof", { length: 48 }).notNull().default("preponderance"),
  // Slug of the code-defined template (src/lib/claim-templates.ts) this claim was copied from.
  templateSlug: varchar("template_slug", { length: 128 }),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const claimElements = pgTable("claim_elements", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id")
    .notNull()
    .references(() => claims.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  // Attorney-assigned rating; the UI shows a computed hint beside it but never overwrites it.
  proofStrength: proofStrengthEnum("proof_strength").notNull().default("gap"),
  status: elementStatusEnum("status").notNull().default("unreviewed"),
  authorityCitation: text("authority_citation"),
  citationStatus: varchar("citation_status", { length: 16 }).notNull().default("verify"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const factLinks = pgTable("fact_links", {
  id: serial("id").primaryKey(),
  claimElementId: integer("claim_element_id")
    .notNull()
    .references(() => claimElements.id, { onDelete: "cascade" }),
  chronologyEventId: integer("chronology_event_id").references(
    () => chronologyEvents.id,
    { onDelete: "cascade" },
  ),
  documentId: integer("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
  polarity: polarityEnum("polarity").notNull().default("supporting"),
  notes: text("notes"),
  kind: evidenceKindEnum("kind").notNull().default("document"),
  pageCite: varchar("page_cite", { length: 64 }),
  quote: text("quote"),
  exhibitLabel: varchar("exhibit_label", { length: 64 }),
  // Speaker/author for testimony links.
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  // Manual links are accepted; AI-suggested links start as proposed.
  reviewState: linkReviewStateEnum("review_state").notNull().default("accepted"),
  aiProposalId: integer("ai_proposal_id").references(() => aiProposals.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const claimElementWitnesses = pgTable("claim_element_witnesses", {
  id: serial("id").primaryKey(),
  claimElementId: integer("claim_element_id")
    .notNull()
    .references(() => claimElements.id, { onDelete: "cascade" }),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  witnessType: witnessTypeEnum("witness_type").notNull().default("fact"),
  notes: text("notes"),
});


export const deadlines = pgTable("deadlines", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id")
    .notNull()
    .references(() => matters.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dueDate: date("due_date").notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  status: deadlineStatusEnum("status").notNull().default("upcoming"),
  notes: text("notes"),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").references(() => matters.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  status: taskStatusEnum("status").notNull().default("open"),
  dueDate: date("due_date"),
  linkedDocumentId: integer("linked_document_id").references(
    () => documents.id,
    { onDelete: "set null" },
  ),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  category: varchar("category", { length: 64 }).notNull().default("system"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ingestionJobs = pgTable("ingestion_jobs", {
  id: serial("id").primaryKey(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  documentId: integer("document_id").references(() => documents.id),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0),
  leaseToken: text("lease_token"),
  leaseUntil: timestamp("lease_until", { withTimezone: true }),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const notebookAssociations = pgTable("notebook_associations", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  documentId: integer("document_id").references(() => documents.id),
  notebookId: text("notebook_id").notNull(),
  sourceId: text("source_id").notNull(),
  artifactHash: text("artifact_hash"),
  status: text("status").notNull(),
  equivalence: text("equivalence").notNull(),
  provenance: jsonb("provenance").$type<Record<string, unknown>>(),
});

// Hosted pilot ledger; RLS scopes all records to the private app role's workspace.
export const processingPilot=pgTable("processing_pilot",{
 workspaceId:uuid("workspace_id").notNull().default("b37e40d6-4746-490c-9b73-ea46e15e2b01"),documentId:integer("document_id").notNull(),originalHash:varchar("original_hash",{length:64}).notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
});
export const processingRequests=pgTable("processing_requests",{
 id:uuid("id").primaryKey(),workspaceId:uuid("workspace_id").notNull().default("b37e40d6-4746-490c-9b73-ea46e15e2b01"),documentId:integer("document_id").notNull(),agentId:uuid("agent_id").notNull(),prompt:text("prompt").notNull(),state:text("state").notNull().default("awaiting_approval"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
});
export const processingRuns=pgTable("processing_runs",{
 id:uuid("id").primaryKey(),workspaceId:uuid("workspace_id").notNull().default("b37e40d6-4746-490c-9b73-ea46e15e2b01"),requestId:uuid("request_id").notNull(),documentId:integer("document_id").notNull(),jobId:integer("job_id").notNull(),snapshot:jsonb("snapshot").$type<Record<string,unknown>>().notNull(),extractionKey:text("extraction_key"),extractionState:text("extraction_state").notNull().default("queued"),aiState:text("ai_state").notNull().default("queued"),result:jsonb("result").$type<Record<string,unknown>>(),error:text("error"),reviewState:text("review_state").notNull().default("unreviewed"),reviewedAt:timestamp("reviewed_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
});
