CREATE TABLE casevault2.processing_pilot (
 workspace_id uuid NOT NULL DEFAULT 'b37e40d6-4746-490c-9b73-ea46e15e2b01',
 document_id integer NOT NULL REFERENCES casevault2.documents(id),
 original_hash varchar(64) NOT NULL CHECK (original_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (workspace_id,document_id), UNIQUE(workspace_id,original_hash)
);
CREATE TABLE casevault2.processing_requests (
 id uuid PRIMARY KEY,
 workspace_id uuid NOT NULL DEFAULT 'b37e40d6-4746-490c-9b73-ea46e15e2b01',
 document_id integer NOT NULL REFERENCES casevault2.documents(id),
 agent_id uuid NOT NULL,
 prompt text NOT NULL,
 state text NOT NULL DEFAULT 'awaiting_approval' CHECK (state IN ('awaiting_approval','approved')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE casevault2.processing_runs (
 id uuid PRIMARY KEY,
 workspace_id uuid NOT NULL DEFAULT 'b37e40d6-4746-490c-9b73-ea46e15e2b01',
 request_id uuid NOT NULL REFERENCES casevault2.processing_requests(id),
 document_id integer NOT NULL REFERENCES casevault2.documents(id),
 job_id integer NOT NULL UNIQUE REFERENCES casevault2.ingestion_jobs(id),
 snapshot jsonb NOT NULL,
 extraction_key text,
 extraction_state text NOT NULL DEFAULT 'queued',
 ai_state text NOT NULL DEFAULT 'queued',
 result jsonb,
 error text,
 review_state text NOT NULL DEFAULT 'unreviewed' CHECK (review_state IN ('unreviewed','accepted','rejected')),
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX processing_requests_document ON casevault2.processing_requests(workspace_id,document_id,created_at DESC);
CREATE INDEX processing_runs_document ON casevault2.processing_runs(workspace_id,document_id,created_at DESC);
CREATE UNIQUE INDEX processing_runs_one_request ON casevault2.processing_runs(workspace_id,request_id);
CREATE INDEX processing_jobs_claim ON casevault2.ingestion_jobs(workspace_id,status,id) WHERE kind='pilot_process';
ALTER TABLE casevault2.processing_pilot ENABLE ROW LEVEL SECURITY;
ALTER TABLE casevault2.processing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE casevault2.processing_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON casevault2.processing_pilot,casevault2.processing_requests,casevault2.processing_runs FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON casevault2.processing_pilot,casevault2.processing_requests,casevault2.processing_runs TO casevault2_app;
CREATE POLICY processing_workspace ON casevault2.processing_pilot TO casevault2_app USING(workspace_id='b37e40d6-4746-490c-9b73-ea46e15e2b01') WITH CHECK(workspace_id='b37e40d6-4746-490c-9b73-ea46e15e2b01');
CREATE POLICY processing_workspace ON casevault2.processing_requests TO casevault2_app USING(workspace_id='b37e40d6-4746-490c-9b73-ea46e15e2b01') WITH CHECK(workspace_id='b37e40d6-4746-490c-9b73-ea46e15e2b01');
CREATE POLICY processing_workspace ON casevault2.processing_runs TO casevault2_app USING(workspace_id='b37e40d6-4746-490c-9b73-ea46e15e2b01') WITH CHECK(workspace_id='b37e40d6-4746-490c-9b73-ea46e15e2b01');
