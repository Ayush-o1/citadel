import 'dotenv/config';
import pg from 'pg';

// Optional local dev seed data for the example `items` table.
// Safe to run multiple times, safe to delete once you have real data.

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const sampleItems = [
  ['Sample item one', 'Replace this with real domain data once it exists.'],
  ['Sample item two', 'Seeded so the frontend has something to render.'],
];

async function seed() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM items');
    if (rows[0].count > 0) {
      console.log('items table already has data, skipping seed.');
      return;
    }

    for (const [name, description] of sampleItems) {
      await client.query('INSERT INTO items (name, description) VALUES ($1, $2)', [
        name,
        description,
      ]);
    }
    console.log(`Seeded ${sampleItems.length} item(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
