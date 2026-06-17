import { sql } from 'drizzle-orm';

declare global {
  var secrets: {
    apiKey?: string;
  };
}

export async function register() {
  // Ensure the database schema exists at startup. Drizzle migrations are not
  // auto-run and drizzle-kit is not present in the standalone runtime image, so
  // we apply the (idempotent) schema here on the Node.js server runtime once
  // DATABASE_URL has been injected at runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DATABASE_URL) {
    try {
      const { db } = await import('./app/db/drizzle');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "todos" (
          "id" serial PRIMARY KEY NOT NULL,
          "content" varchar(255) NOT NULL,
          "completed" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now()
        );
      `);
      console.log('DB schema ensured (todos)');
    } catch (err) {
      console.error('Failed to ensure DB schema', err);
    }
  }

  global.secrets = {};

  let org = process.env.HCP_ORG;
  let project = process.env.HCP_PROJECT;
  let secretName = 'Demo';

  if (!org) {
    global.secrets.apiKey = 'Demo: You have not loaded your secrets';
    return;
  }

  let res = await fetch(
    `https://api.cloud.hashicorp.com/secrets/2023-06-13/organizations/${org}/projects/${project}/apps/${secretName}/open`,
    {
      headers: {
        Authorization: `Bearer ${process.env.HCP_API_KEY}`,
      },
    }
  );

  let { secrets } = await res.json();
  global.secrets.apiKey = secrets[0].version.value;

  console.log('Secrets loaded!');
}
