-- Claims matrix & evidence mapping: extends prototype claims/claim_elements/fact_links
-- and adds element witnesses. Additive only; existing rows remain valid.
CREATE TYPE casevault2.proof_strength AS ENUM ('strong','moderate','weak','gap');
CREATE TYPE casevault2.element_status AS ENUM ('unreviewed','in_progress','supported','disputed','gap');
CREATE TYPE casevault2.evidence_kind AS ENUM ('document','testimony','chronology','note');
CREATE TYPE casevault2.link_review_state AS ENUM ('proposed','accepted','rejected');
CREATE TYPE casevault2.witness_type AS ENUM ('fact','expert','adverse','party','custodian');

ALTER TABLE casevault2.claims
  ADD COLUMN chart_type varchar(48) NOT NULL DEFAULT 'civil-element',
  ADD COLUMN cause_of_action text,
  ADD COLUMN jurisdiction varchar(128),
  ADD COLUMN burden_of_proof varchar(48) NOT NULL DEFAULT 'preponderance',
  ADD COLUMN template_slug varchar(128),
  ADD COLUMN position integer NOT NULL DEFAULT 0,
  ADD COLUMN created_at timestamp NOT NULL DEFAULT now(),
  ADD COLUMN updated_at timestamp NOT NULL DEFAULT now();

ALTER TABLE casevault2.claim_elements
  ADD COLUMN position integer NOT NULL DEFAULT 0,
  ADD COLUMN proof_strength casevault2.proof_strength NOT NULL DEFAULT 'gap',
  ADD COLUMN status casevault2.element_status NOT NULL DEFAULT 'unreviewed',
  ADD COLUMN authority_citation text,
  ADD COLUMN citation_status varchar(16) NOT NULL DEFAULT 'verify' CHECK (citation_status IN ('verify','verified')),
  ADD COLUMN notes text,
  ADD COLUMN updated_at timestamp NOT NULL DEFAULT now();

ALTER TABLE casevault2.fact_links
  ADD COLUMN kind casevault2.evidence_kind NOT NULL DEFAULT 'document',
  ADD COLUMN page_cite varchar(64),
  ADD COLUMN quote text,
  ADD COLUMN exhibit_label varchar(64),
  ADD COLUMN contact_id integer REFERENCES casevault2.contacts(id) ON DELETE SET NULL,
  ADD COLUMN review_state casevault2.link_review_state NOT NULL DEFAULT 'accepted',
  ADD COLUMN ai_proposal_id integer REFERENCES casevault2.ai_proposals(id) ON DELETE SET NULL,
  ADD COLUMN created_at timestamp NOT NULL DEFAULT now();

-- Preserve existing prototype ordering.
UPDATE casevault2.claim_elements SET position = id;
UPDATE casevault2.claims SET position = id;

CREATE TABLE casevault2.claim_element_witnesses (
  id serial PRIMARY KEY,
  workspace_id uuid NOT NULL DEFAULT 'b37e40d6-4746-490c-9b73-ea46e15e2b01',
  claim_element_id integer NOT NULL REFERENCES casevault2.claim_elements(id) ON DELETE CASCADE,
  contact_id integer NOT NULL REFERENCES casevault2.contacts(id) ON DELETE CASCADE,
  witness_type casevault2.witness_type NOT NULL DEFAULT 'fact',
  notes text,
  UNIQUE (claim_element_id, contact_id)
);

CREATE INDEX IF NOT EXISTS claim_element_witnesses_contact_id_idx ON casevault2.claim_element_witnesses(contact_id);
CREATE INDEX IF NOT EXISTS fact_links_contact_id_idx ON casevault2.fact_links(contact_id);
CREATE INDEX IF NOT EXISTS fact_links_ai_proposal_id_idx ON casevault2.fact_links(ai_proposal_id);
CREATE INDEX IF NOT EXISTS claim_elements_claim_position_idx ON casevault2.claim_elements(claim_id, position);

ALTER TABLE casevault2.claim_element_witnesses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON casevault2.claim_element_witnesses FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON casevault2.claim_element_witnesses TO casevault2_app;
GRANT USAGE, SELECT ON SEQUENCE casevault2.claim_element_witnesses_id_seq TO casevault2_app;
CREATE POLICY private_workspace ON casevault2.claim_element_witnesses TO casevault2_app
  USING (workspace_id = 'b37e40d6-4746-490c-9b73-ea46e15e2b01'::uuid)
  WITH CHECK (workspace_id = 'b37e40d6-4746-490c-9b73-ea46e15e2b01'::uuid);
