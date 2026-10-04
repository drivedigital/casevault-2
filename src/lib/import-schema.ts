import { z } from "zod";
const id=z.number().int().positive();
const provenance=z.record(z.string(),z.unknown()).optional();
const externalId=z.string().min(1).max(1000);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish();
const text=z.string().max(100000).nullish();
export const importSchemas={
 matters:z.object({externalId,name:z.string().min(1),caseNumber:text,court:text,description:text,provenance}).strict(),
 contacts:z.object({externalId,displayName:z.string().min(1),type:z.enum(["individual","organization","law_firm","court"]).optional(),primaryEmail:text,primaryPhone:text,notes:text,provenance}).strict(),
 dockets:z.object({externalId,matterId:id.nullish(),indexNumber:z.string().min(1),court:z.string().min(1),caption:z.string().min(1),sourceUrl:text,notebookId:text}).strict(),
 documents:z.object({externalId,matterId:id.nullish(),docketId:id.nullish(),title:z.string().min(1),fileName:text,sourceType:z.enum(["docket_filing","drive","upload","email"]),sourceSystem:text,status:z.enum(["pending_review","processing","indexed","verified","flagged"]).optional(),sha256:z.string().regex(/^[a-f0-9]{64}$/).nullish(),pageCount:z.number().int().nonnegative().nullable(),objectKey:text,objectBucket:text,fileUrl:text,ocrText:text,filedDate:date,provenance}).strict(),
 entries:z.object({externalId,docketId:id,sequenceNumber:z.number().int().positive(),filedDate:date,docType:z.string().min(1),description:text,documentId:id.nullish(),availability:z.enum(["public_pdf","deleted","restricted","metadata_only"]),sourceStatus:text,sourceUrl:text,provenance}).strict(),
 jobs:z.object({idempotencyKey:z.string().min(1),documentId:id.nullish(),kind:z.enum(["extract","reconcile_original","refresh_docket","notebook_sync"]),status:z.enum(["queued","needs_human","failed"]).optional(),payload:z.record(z.string(),z.unknown()),error:text}).strict(),
 notebooks:z.object({externalId,documentId:id.nullish(),notebookId:z.string().uuid(),sourceId:z.string().uuid(),artifactHash:z.string().regex(/^[a-f0-9]{64}$/).nullish(),status:z.enum(["ready","failed","processing"]),equivalence:z.enum(["uploaded_hash","title_candidate","unverified"]),provenance}).strict(),
 connectors:z.object({name:z.string(),kind:z.string(),status:z.enum(["connected","disconnected","syncing","error"]),detail:text}).strict(),
 roles:z.object({contactId:id,matterId:id,capacity:z.string(),roleLabel:z.string(),side:text}).strict(),
 relationships:z.object({fromContactId:id,toContactId:id,relationshipType:z.string(),notes:text}).strict(),
};
