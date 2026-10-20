// Jalankan: node scripts/apply-schema.mjs  (membaca POSTGRES_URL_NON_POOLING dari .env.local)
import fs from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
  }),
);
const url = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
if (!url) throw new Error("POSTGRES_URL_NON_POOLING belum ada di .env.local (jalankan: vercel env pull .env.local)");

const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]+/, ""), ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(fs.readFileSync("supabase/schema.sql", "utf8"));
await client.end();
console.log("Skema diterapkan.");
