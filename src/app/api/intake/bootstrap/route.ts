import { z } from "zod";
import { importSchemas } from "@/lib/import-schema";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { matters, contacts, contactRoles, contactRelationships, dockets, documents, docketEntries, ingestionJobs, notebookAssociations, sourceConnectors } from "@/db/schema";
import { equalSecret } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Administrative import bridge. Only the machine credential can import batches.
export async function POST(req: Request) {
  const env=getCloudflareContext().env;
  if (!await equalSecret(req.headers.get("authorization")?.replace(/^Bearer /,"")??"",env.CASEVAULT_API_TOKEN)) return NextResponse.json({error:"Machine credential required"},{status:403});
  const parsed=z.object({kind:z.enum(["matters","contacts","dockets","documents","entries","jobs","notebooks","connectors","roles","relationships"]),rows:z.array(z.unknown()).max(600)}).safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid import envelope"},{status:400});
  const body=parsed.data;
  const valid=importSchemas[body.kind].array().safeParse(body.rows);
  if (!valid.success) return NextResponse.json({error:"Invalid records",issues:valid.error.issues},{status:400});
  if (body.rows.length === 0) return NextResponse.json([]);
  if (!Array.isArray(body.rows)||body.rows.length>600) return NextResponse.json({error:"rows must contain at most 600 records"},{status:400});

  const kind=body.kind;
  // The fixed schema and fixed table list keep import payloads out of SQL identifiers.
  switch(kind) {
    case "matters": { const rows=importSchemas.matters.array().parse(body.rows); return NextResponse.json(await db.insert(matters).values(rows).onConflictDoUpdate({target:matters.externalId,set:{name:matters.name}}).returning()); }
    case "contacts": { const rows=importSchemas.contacts.array().parse(body.rows); return NextResponse.json(await db.insert(contacts).values(rows).onConflictDoUpdate({target:contacts.externalId,set:{displayName:contacts.displayName}}).returning()); }
    case "dockets": { const rows=importSchemas.dockets.array().parse(body.rows); return NextResponse.json(await db.insert(dockets).values(rows).onConflictDoUpdate({target:dockets.externalId,set:{caption:dockets.caption}}).returning()); }
    case "documents": { const rows=importSchemas.documents.array().parse(body.rows); return NextResponse.json(await db.insert(documents).values(rows).onConflictDoUpdate({target:documents.externalId,set:{title:documents.title}}).returning()); }
    case "entries": { const rows=importSchemas.entries.array().parse(body.rows); return NextResponse.json(await db.insert(docketEntries).values(rows).onConflictDoUpdate({target:docketEntries.externalId,set:{docType:docketEntries.docType}}).returning()); }
    case "jobs": { const rows=importSchemas.jobs.array().parse(body.rows); return NextResponse.json(await db.insert(ingestionJobs).values(rows).onConflictDoNothing({target:ingestionJobs.idempotencyKey}).returning()); }
    case "notebooks": { const rows=importSchemas.notebooks.array().parse(body.rows); return NextResponse.json(await db.insert(notebookAssociations).values(rows).onConflictDoUpdate({target:notebookAssociations.externalId,set:{sourceId:notebookAssociations.sourceId}}).returning()); }
    case "connectors": { const rows=importSchemas.connectors.array().parse(body.rows); return NextResponse.json(await db.insert(sourceConnectors).values(rows).onConflictDoUpdate({target:sourceConnectors.kind,set:{status:sourceConnectors.status}}).returning()); }
    case "roles": { const rows=importSchemas.roles.array().parse(body.rows); return NextResponse.json(await db.insert(contactRoles).values(rows).onConflictDoNothing().returning()); }
    case "relationships": { const rows=importSchemas.relationships.array().parse(body.rows); return NextResponse.json(await db.insert(contactRelationships).values(rows).onConflictDoNothing().returning()); }
    default:return NextResponse.json({error:"Unknown import kind"},{status:400});
  }
}
