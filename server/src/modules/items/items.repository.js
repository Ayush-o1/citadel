import { query } from '../../config/db.js';

// Raw SQL, no ORM. This is the only file that knows about the `items`
// table shape — swap or delete this module without touching anything else.
export const itemsRepository = {
  async findAll() {
    const { rows } = await query(
      'SELECT id, name, description, created_at FROM items ORDER BY created_at DESC'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT id, name, description, created_at FROM items WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, description }) {
    const { rows } = await query(
      `INSERT INTO items (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at`,
      [name, description ?? null]
    );
    return rows[0];
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM items WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
