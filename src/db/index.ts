import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

const getDatabase = cache(() => {
  let connectionString: string | undefined;
  try {
    const ctx = getCloudflareContext();
    connectionString = ctx?.env?.HYPERDRIVE?.connectionString;
  } catch {}
  if (!connectionString || connectionString.includes("127.0.0.1:5432/casevault2")) {
    connectionString = process.env.DATABASE_URL;
  }
  const isSupabase = connectionString?.includes("supabase.co");
  const cleanConn = isSupabase
    ? connectionString?.replace(/([?&])sslmode=[^&]*/, "$1").replace(/[?&]$/, "")
    : connectionString;
  const pool = new Pool({
    connectionString: cleanConn,
    max: 5,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });
  try {
    getCloudflareContext().ctx.waitUntil(new Promise<void>((resolve) => {
      setTimeout(() => { void pool.end().then(resolve); }, 30000);
    }));
  } catch {}
  return drizzle(pool);
});
export const db = new Proxy({} as ReturnType<typeof getDatabase>, {
  get(_target, property) {
    const database = getDatabase();
    const value = Reflect.get(database, property);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
