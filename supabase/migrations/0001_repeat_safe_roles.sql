CREATE UNIQUE INDEX contact_roles_import_identity ON casevault2.contact_roles (contact_id,matter_id,capacity,role_label) WHERE matter_id IS NOT NULL;
