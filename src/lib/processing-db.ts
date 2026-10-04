import 'server-only';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getCloudflareContext } from '@opennextjs/cloudflare';
export async function withProcessingDb<T>(operation: (database: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> { const pool = new Pool({ connectionString: getCloudflareContext().env.HYPERDRIVE.connectionString, max: 1 }); try {
    return await operation(drizzle(pool));
}
finally {
    await pool.end();
} }
