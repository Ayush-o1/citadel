import 'dotenv/config';
import pg from 'pg';

// Phase 02 synthetic data — see .ai/phases/PHASE-02-synthetic-data.md.
// Layer 3 added for RB-6 (2026-09-01) — see .ai/FRONTEND-REBUILD-PLAN.md.
//
// All layers fully deterministic (no Math.random() anywhere, so
// re-running against a fresh database always produces identical data):
//
//   1. OFFICIAL_ROWS — the exact 7-row Caterpillar sample dataset
//      (PROBLEM-STATEMENT.md Source A), reproduced as historical
//      completed checkouts with daily usage_logs that reconstruct the
//      stated Engine/Idle Hours-per-day averages exactly.
//   2. VOLUME_EQUIPMENT / ACTIVE_CHECKOUTS — additional synthetic
//      equipment/checkouts, dated relative to "now" (script run time),
//      giving later phases: enough trailing weekly history per
//      equipment-type/site pair to forecast from (and one deliberately
//      sparse pair to exercise the "insufficient history" fallback), and
//      live active checkouts covering overdue / upcoming-return /
//      missing-assignment / unusual-movement / healthy-baseline /
//      underutilized-capacity states.
//   3. CAPACITY_BASELINE_HISTORY — three historical, healthy-band
//      Excavator rentals giving the capacity-aware optimization feature
//      (RB-6) a real "typical workload" baseline to compute against.
//
// Idempotent: skips entirely if `equipment` already has rows.

// Must match src/config/db.js's SSL handling — see migrate.js's comment
// for why this can't be skipped for hosted Postgres.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function timestampHoursFromNow(h) {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + h);
  return d.toISOString();
}

function timestampDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

// --- Layer 1: the official Caterpillar sample, reproduced exactly ---
//
// Assumption (documented, not silently smoothed over): six of the seven
// rows' stated Operating Days match (Check-In date - Check-Out date)
// exactly; EQX1003 instead matches (Check-In - Check-Out + 1). We treat
// each row's stated `operatingDays` as authoritative for the number of
// usage_logs rows generated (one per operating day, starting at
// checked_out_at) rather than re-deriving it from the dates, since
// Caterpillar's own count is the more specific piece of information. We
// did not alter any stated date or day count to reconcile this.
const OFFICIAL_ROWS = [
  { code: 'EQX1001', type: 'Excavator', site: 'S003', operator: 'OP101', checkedOut: '2025-04-01', checkedIn: '2025-04-16', operatingDays: 15, engineHours: 1.5, idleHours: 10 },
  { code: 'EQX1002', type: 'Crane', site: null, operator: null, checkedOut: '2025-03-10', checkedIn: '2025-03-30', operatingDays: 20, engineHours: 0, idleHours: 11 },
  { code: 'EQX1003', type: 'Bulldozer', site: 'S002', operator: 'OP203', checkedOut: '2025-02-15', checkedIn: '2025-03-11', operatingDays: 25, engineHours: 7.5, idleHours: 0.5 },
  { code: 'EQX1004', type: 'Excavator', site: 'S004', operator: 'OP106', checkedOut: '2025-05-05', checkedIn: '2025-05-15', operatingDays: 10, engineHours: 2, idleHours: 9 },
  { code: 'EQX1005', type: 'Bulldozer', site: 'S006', operator: 'OP301', checkedOut: '2025-01-01', checkedIn: '2025-01-31', operatingDays: 30, engineHours: 8, idleHours: 0 },
  { code: 'EQX1006', type: 'Grader', site: 'S001', operator: 'OP114', checkedOut: '2025-04-05', checkedIn: '2025-04-23', operatingDays: 18, engineHours: 3, idleHours: 6 },
  { code: 'EQX1007', type: 'Excavator', site: null, operator: null, checkedOut: '2025-03-20', checkedIn: '2025-04-01', operatingDays: 12, engineHours: 0, idleHours: 12 },
];

// --- Layer 2a: additional equipment for trailing weekly history ---
// Excavator/S003 and Bulldozer/S002 are built up to a *rich* history
// (enough trailing periods for Phase 06 to forecast from); Grader/S001
// is deliberately left *sparse* (2 total checkouts) so Phase 06's
// "insufficient history" fallback (REQ-019) has a real case to hit.
const VOLUME_EQUIPMENT = [
  { code: 'EQX2001', type: 'Excavator', site: 'S003', checkouts: 2 },
  { code: 'EQX2002', type: 'Excavator', site: 'S003', checkouts: 2 },
  { code: 'EQX2003', type: 'Bulldozer', site: 'S002', checkouts: 3 },
  { code: 'EQX2004', type: 'Grader', site: 'S001', checkouts: 1 },
  { code: 'EQX2005', type: 'Crane', site: 'S005', checkouts: 2 },
];

// Cycled deterministically across volume checkouts — not random, a fixed
// small set of named utilization patterns.
const VOLUME_PROFILES = [
  { label: 'well-utilized', engineHours: 6, idleHours: 1.5 },
  { label: 'moderate', engineHours: 4, idleHours: 3 },
  { label: 'poor-utilization', engineHours: 2, idleHours: 6 },
];

// --- Layer 3: capacity-baseline history (RB-6, 2026-09-01) ---
//
// The capacity-aware optimization feature (.ai/FRONTEND-REBUILD-PLAN.md
// section 4) needs a real "typical workload" baseline: the median total
// engine hours across historical RETURNED checkouts of a given equipment
// type that themselves fell in the existing 65-75% healthy utilization
// band, gated at >=3 samples before being trusted
// (capacity.service.js's MIN_BASELINE_SAMPLES). None of Layer 1/2a's
// existing Excavator history happens to land in that exact band (by
// design, they demonstrate other signals), so this layer adds three
// deliberately healthy-band, isolated, historical Excavator rentals
// purely to give the capacity feature real data to compute from — same
// deterministic-data discipline as every other layer (fixed values, old
// historical dates so they don't skew the 28-day forecast window).
// engineHours=5.2, idleHours=2.3 -> ratio 5.2/7.5 = 0.693, inside band.
const CAPACITY_BASELINE_HISTORY = [
  { code: 'EQX5001', type: 'Excavator', site: 'S003', operator: 'OP501', checkedOut: '2025-07-01', operatingDays: 20, engineHours: 5.2, idleHours: 2.3 },
  { code: 'EQX5002', type: 'Excavator', site: 'S004', operator: 'OP502', checkedOut: '2025-07-15', operatingDays: 20, engineHours: 5.2, idleHours: 2.3 },
  { code: 'EQX5003', type: 'Excavator', site: 'S003', operator: 'OP503', checkedOut: '2025-08-01', operatingDays: 20, engineHours: 5.2, idleHours: 2.3 },
];

// --- Layer 2b: live active checkouts for the demo ---
const ACTIVE_CHECKOUTS = [
  {
    code: 'EQX3001', type: 'Excavator', site: 'S003', operator: 'OP401',
    checkedOutDaysAgo: 5, expectedReturnHoursFromNow: -48, // overdue
    logs: [{ engineHours: 5, idleHours: 1.5 }, { engineHours: 5, idleHours: 1.5 }, { engineHours: 4.5, idleHours: 2 }],
    note: 'overdue',
  },
  {
    code: 'EQX3002', type: 'Bulldozer', site: 'S002', operator: 'OP402',
    checkedOutDaysAgo: 3, expectedReturnHoursFromNow: 18, // upcoming return
    logs: [{ engineHours: 6, idleHours: 1 }, { engineHours: 6.5, idleHours: 0.5 }],
    note: 'upcoming_return',
  },
  {
    code: 'EQX3003', type: 'Crane', site: null, operator: null,
    checkedOutDaysAgo: 2, expectedReturnHoursFromNow: 120,
    logs: [{ engineHours: 3, idleHours: 2 }],
    note: 'missing_assignment (active)',
  },
  {
    code: 'EQX3004', type: 'Excavator', site: 'S004', operator: 'OP403',
    checkedOutDaysAgo: 4, expectedReturnHoursFromNow: 96,
    logs: [
      { engineHours: 5, idleHours: 1.5, location: 'Site S002 yard' },
      { engineHours: 4.5, idleHours: 2, location: 'Site S002 yard' },
      { engineHours: 5, idleHours: 1.5, location: 'Site S004 yard' },
    ],
    note: 'unusual_movement — logged location (S002) does not match assigned site (S004)',
  },
  {
    code: 'EQX3005', type: 'Grader', site: 'S001', operator: 'OP404',
    checkedOutDaysAgo: 3, expectedReturnHoursFromNow: 144,
    logs: [{ engineHours: 6, idleHours: 1 }, { engineHours: 6, idleHours: 1 }, { engineHours: 5.5, idleHours: 1 }],
    note: 'healthy baseline — no flags expected',
  },
  {
    // RB-6 capacity-aware optimization demo case: a long (60-day) rental
    // window with genuinely light-but-legitimate daily usage (idle ratio
    // stays under the 0.40 excessive_idle threshold, so this is a distinct
    // signal from the anomaly engine, not a restatement of it) — enough
    // evidence (5 logged days, >= MIN_LOGGED_DAYS) to compute a real
    // completion estimate against the Layer 3 Excavator baseline above,
    // and enough remaining rental window (~55 days) that the estimate
    // lands well inside it, triggering underutilized_capacity.
    code: 'EQX3006', type: 'Excavator', site: 'S003', operator: 'OP405',
    checkedOutDaysAgo: 5, expectedReturnHoursFromNow: 55 * 24,
    logs: [
      { engineHours: 4, idleHours: 2 },
      { engineHours: 4, idleHours: 2 },
      { engineHours: 3.5, idleHours: 1.5 },
      { engineHours: 4, idleHours: 2 },
      { engineHours: 4.5, idleHours: 2 },
    ],
    note: 'capacity: underutilized — pace suggests an early-return/reassignment candidate against a 60-day window',
  },
];

async function insertUsageLogs(client, checkoutId, equipmentId, startDate, entries) {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    await client.query(
      `INSERT INTO usage_logs (checkout_id, equipment_id, logged_at, engine_hours, idle_hours, location)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [checkoutId, equipmentId, addDays(startDate, i), entry.engineHours, entry.idleHours, entry.location ?? null]
    );
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM equipment');
    if (rows[0].count > 0) {
      console.log('equipment table already has data, skipping seed.');
      return;
    }

    await client.query('BEGIN');

    // Sites: every code referenced anywhere below, official gap (S005) included.
    const siteCodes = ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'];
    const siteId = {};
    for (const code of siteCodes) {
      const { rows } = await client.query(
        'INSERT INTO sites (code) VALUES ($1) RETURNING id',
        [code]
      );
      siteId[code] = rows[0].id;
    }

    // Operators: official + active-checkout + volume-checkout codes.
    const operatorCodes = [
      'OP101', 'OP106', 'OP114', 'OP203', 'OP301', // official
      'OP401', 'OP402', 'OP403', 'OP404', // active checkouts (EQX3003 deliberately has none)
      'OP405', // EQX3006 (RB-6 capacity demo case)
      'OP501', 'OP502', 'OP503', 'OP504', // volume checkouts, cycled
    ];
    const operatorId = {};
    for (const code of operatorCodes) {
      const { rows } = await client.query(
        'INSERT INTO operators (code) VALUES ($1) RETURNING id',
        [code]
      );
      operatorId[code] = rows[0].id;
    }

    const equipmentId = {};
    async function insertEquipment(code, type, status) {
      const { rows } = await client.query(
        'INSERT INTO equipment (equipment_code, type, status) VALUES ($1, $2, $3) RETURNING id',
        [code, type, status]
      );
      equipmentId[code] = rows[0].id;
    }

    // --- Layer 1: official sample ---
    for (const row of OFFICIAL_ROWS) {
      await insertEquipment(row.code, row.type, 'available');
    }
    for (const row of OFFICIAL_ROWS) {
      const { rows } = await client.query(
        `INSERT INTO checkouts (equipment_id, operator_id, site_id, checked_out_at, checked_in_at, status)
         VALUES ($1, $2, $3, $4, $5, 'returned') RETURNING id`,
        [
          equipmentId[row.code],
          row.operator ? operatorId[row.operator] : null,
          row.site ? siteId[row.site] : null,
          row.checkedOut,
          row.checkedIn,
        ]
      );
      const entries = Array.from({ length: row.operatingDays }, () => ({
        engineHours: row.engineHours,
        idleHours: row.idleHours,
      }));
      await insertUsageLogs(client, rows[0].id, equipmentId[row.code], row.checkedOut, entries);
    }

    // --- Layer 3: capacity-baseline history ---
    for (const row of CAPACITY_BASELINE_HISTORY) {
      await insertEquipment(row.code, row.type, 'available');
      const checkedIn = addDays(row.checkedOut, row.operatingDays);
      const { rows } = await client.query(
        `INSERT INTO checkouts (equipment_id, operator_id, site_id, checked_out_at, checked_in_at, status, condition_out, condition_in)
         VALUES ($1, $2, $3, $4, $5, 'returned', 'Good', 'Good') RETURNING id`,
        [equipmentId[row.code], operatorId[row.operator], siteId[row.site], row.checkedOut, checkedIn]
      );
      const entries = Array.from({ length: row.operatingDays }, () => ({
        engineHours: row.engineHours,
        idleHours: row.idleHours,
      }));
      await insertUsageLogs(client, rows[0].id, equipmentId[row.code], row.checkedOut, entries);
    }

    // --- Layer 2a: trailing weekly history for forecasting ---
    for (const veh of VOLUME_EQUIPMENT) {
      await insertEquipment(veh.code, veh.type, 'available');
      let operatorCursor = 0;
      for (let c = 0; c < veh.checkouts; c++) {
        const weeksAgo = veh.checkouts - c; // oldest first
        const checkedOut = daysAgo(weeksAgo * 7);
        const checkedIn = addDays(checkedOut, 5); // a 5-day rental each time
        const profile = VOLUME_PROFILES[(c + veh.checkouts) % VOLUME_PROFILES.length];
        const opCode = operatorCodes.filter((o) => o.startsWith('OP5'))[operatorCursor % 4];
        operatorCursor++;

        const { rows } = await client.query(
          `INSERT INTO checkouts (equipment_id, operator_id, site_id, checked_out_at, checked_in_at, status, condition_out, condition_in)
           VALUES ($1, $2, $3, $4, $5, 'returned', 'Good', 'Good') RETURNING id`,
          [equipmentId[veh.code], operatorId[opCode], siteId[veh.site], checkedOut, checkedIn]
        );
        const entries = Array.from({ length: 5 }, () => ({
          engineHours: profile.engineHours,
          idleHours: profile.idleHours,
        }));
        await insertUsageLogs(client, rows[0].id, equipmentId[veh.code], checkedOut, entries);
      }
    }

    // --- Layer 2b: live active checkouts ---
    for (const ac of ACTIVE_CHECKOUTS) {
      await insertEquipment(ac.code, ac.type, 'checked_out');
      const checkedOutAt = timestampDaysAgo(ac.checkedOutDaysAgo);
      const expectedReturnAt = timestampHoursFromNow(ac.expectedReturnHoursFromNow);
      const { rows } = await client.query(
        `INSERT INTO checkouts (equipment_id, operator_id, site_id, checked_out_at, expected_return_at, status, condition_out)
         VALUES ($1, $2, $3, $4, $5, 'active', 'Good') RETURNING id`,
        [
          equipmentId[ac.code],
          ac.operator ? operatorId[ac.operator] : null,
          ac.site ? siteId[ac.site] : null,
          checkedOutAt,
          expectedReturnAt,
        ]
      );
      const startDate = checkedOutAt.slice(0, 10);
      await insertUsageLogs(client, rows[0].id, equipmentId[ac.code], startDate, ac.logs);
    }

    await client.query('COMMIT');

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM sites) AS sites,
        (SELECT COUNT(*) FROM operators) AS operators,
        (SELECT COUNT(*) FROM equipment) AS equipment,
        (SELECT COUNT(*) FROM checkouts) AS checkouts,
        (SELECT COUNT(*) FROM usage_logs) AS usage_logs
    `);
    console.log('Seeded:', counts.rows[0]);
    console.log('Active checkout demo cases:', ACTIVE_CHECKOUTS.map((a) => `${a.code}: ${a.note}`).join('; '));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
