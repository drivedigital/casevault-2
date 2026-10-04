import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  aiProposals,
  contacts,
  contactAliases,
  documentTags,
  documents,
  activityLog,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const proposalId = Number(id);
  const parsed = z.object({action:z.enum(["accept","reject"])}).safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid request"},{status:400});
  const body = parsed.data;
  const action = body.action as "accept" | "reject";

  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'accept' or 'reject'." }, { status: 400 });
  }

  const [proposal] = await db.select().from(aiProposals).where(eq(aiProposals.id, proposalId));
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  if (proposal.type === "alias_merge") return NextResponse.json({error:"Reviewed reversible merging is not enabled yet"},{status:409});

  const newStatus = action === "accept" ? "accepted" : "rejected";

  if (action === "accept") {
    const payload = (proposal.payload ?? {}) as Record<string, unknown>;

    switch (proposal.type) {
      case "entity_suggestion": {
        if (proposal.documentId && payload.contactId) {
          const [contact] = await db
            .select()
            .from(contacts)
            .where(eq(contacts.id, Number(payload.contactId)));
          await db.insert(documentTags).values({
            documentId: proposal.documentId,
            tagType: "party",
            tagValue: contact?.displayName ?? "Unknown",
            contactId: Number(payload.contactId),
          });
        }
        break;
      }
      case "summary": {
        if (proposal.documentId) {
          await db
            .update(documents)
            .set({ aiSummary: proposal.description ?? undefined })
            .where(eq(documents.id, proposal.documentId));
        }
        break;
      }
      case "review_flag":
      case "concept_map":
      case "duplicate": {
        if (proposal.documentId) {
          await db
            .update(documents)
            .set({ isFlagged: true, flagReason: proposal.description ?? undefined, status: "flagged" })
            .where(eq(documents.id, proposal.documentId));
        }
        break;
      }
    }
  }

  const [updated] = await db
    .update(aiProposals)
    .set({ status: newStatus })
    .where(eq(aiProposals.id, proposalId))
    .returning();

  await db.insert(activityLog).values({
    message: `Proposal "${proposal.title}" was ${newStatus}.`,
    category: "ai",
  });

  return NextResponse.json({ proposal: updated });
}
