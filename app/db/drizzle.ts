import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

let _client: Sql | undefined;
let _db: PostgresJsDatabase | undefined;

// Initialise the connection lazily so that importing this module during
// `next build` (when DATABASE_URL is injected only at runtime) does not
// connect or throw. The connection is created on first actual use.
function ensure() {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _client = postgres(process.env.DATABASE_URL);
    _db = drizzle(_client);
  }
  return { client: _client, db: _db! };
}

export const client = new Proxy(function () {} as unknown as Sql, {
  apply(_target, thisArg, args) {
    return (ensure().client as any).apply(thisArg, args);
  },
  get(_target, prop) {
    return (ensure().client as any)[prop];
  },
}) as Sql;

export const db = new Proxy({} as PostgresJsDatabase, {
  get(_target, prop) {
    return (ensure().db as any)[prop];
  },
}) as PostgresJsDatabase;
