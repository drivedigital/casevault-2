import 'server-only';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function withProcessingDb<T>(operation: (database: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
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
    max: 1,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });

  try {
    return await operation(drizzle(pool));
  } finally {
    await pool.end();
  }
}
