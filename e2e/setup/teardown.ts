import pg from "pg";

async function globalTeardown() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(`DELETE FROM "user" WHERE email LIKE '%@test.com'`);
    console.log(`[teardown] Deleted ${result.rowCount} E2E test user(s).`);
  } catch (err) {
    console.error("[teardown] Failed to delete E2E users:", err);
  } finally {
    await client.end();
  }
}

export default globalTeardown;
