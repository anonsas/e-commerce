import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/lib/env";
import * as schema from "@/db/schema";

/*
Makes HTTP requests to Neon on each query — no persistent connection
Works in serverless/edge environments (Vercel, Cloudflare Workers) where TCP connections can't be held open
No native transaction support (needs Neon's own transaction wrapper)
*/
// import { drizzle } from "drizzle-orm/neon-http";
// export const db = drizzle(process.env.DATABASE_URL!, { schema });

/*
Maintains a persistent TCP connection pool
Full transaction support out of the box
Ideal for long-running servers (Express, Fastify running on a VPS/container)
*/
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });
