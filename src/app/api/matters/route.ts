import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { matters, activityLog } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const allMatters = await db.select().from(matters).orderBy(asc(matters.id));
  return NextResponse.json({ matters: allMatters });
}

export async function POST(req: Request) {
  const schema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    caseNumber: z.string().trim().nullish(),
    court: z.string().trim().nullish(),
    description: z.string().trim().nullish(),
    status: z.string().trim().default("active"),
  });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, caseNumber, court, description, status } = parsed.data;

  const [newMatter] = await db
    .insert(matters)
    .values({
      name,
      caseNumber: caseNumber || null,
      court: court || null,
      description: description || null,
      status: status || "active",
      externalId: `matter-manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      provenance: {
        createdVia: "ui",
        createdAt: new Date().toISOString(),
      },
    })
    .returning();

  await db.insert(activityLog).values({
    message: `Created new matter "${newMatter.name}".`,
    category: "core",
  });

  return NextResponse.json({ matter: newMatter }, { status: 201 });
}
