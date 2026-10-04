import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

const getDatabase = cache(() => {
  const env = getCloudflareContext().env;
  const pool = new Pool({ connectionString: env.HYPERDRIVE.connectionString, max: 5 });
  getCloudflareContext().ctx.waitUntil(new Promise<void>((resolve) => {
    setTimeout(() => { void pool.end().then(resolve); }, 30000);
  }));
  return drizzle(pool);
});
export const db = new Proxy({} as ReturnType<typeof getDatabase>, {
  get(_target, property) {
    const database = getDatabase();
    const value = Reflect.get(database, property);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
