import { NextResponse } from "next/server";
import { db } from "@/db";
import { ingestionJobs } from "@/db/schema";
import { asc } from "drizzle-orm";
export async function GET() { return NextResponse.json(await db.select().from(ingestionJobs).orderBy(asc(ingestionJobs.id))); }
