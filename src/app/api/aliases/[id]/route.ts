import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactAliases, activityLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const aliasId = Number(id);
  const parsed = z.object({ resolved: z.boolean() }).safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid request"},{status:400});
  const body = parsed.data;

  const [updated] = await db
    .update(contactAliases)
    .set({ resolved: Boolean(body.resolved) })
    .where(eq(contactAliases.id, aliasId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Alias not found." }, { status: 404 });
  }

  await db.insert(activityLog).values({
    message: `Alias "${updated.aliasName}" marked as ${body.resolved ? "resolved" : "unresolved"}.`,
    category: "converge",
  });

  return NextResponse.json({ alias: updated });
}
