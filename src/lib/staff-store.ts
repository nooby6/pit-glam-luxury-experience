import bcrypt from "bcryptjs";

let db: any = null;
let initError: unknown = null;

function initDb() {
  if (db || initError) return;
  try {
    // Lazy require to avoid bundling issues on platforms without native addons.
    // better-sqlite3 is a native module and may not be available in some runtimes.
    // If unavailable, the module will fall back to `null` and callers should handle it.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require("better-sqlite3");
    const path = process.env.STAFF_DB_PATH ?? "./data/pitglam.db";
    db = new Database(path);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at INTEGER NOT NULL
      );
    `);
  } catch (err) {
    initError = err;
    // eslint-disable-next-line no-console
    console.error("staff-store init error:", err);
    db = null;
  }
}

export async function createUser(email: string, password: string, displayName?: string) {
  initDb();
  if (!db) throw new Error("staff-store unavailable");
  const hash = await bcrypt.hash(password, 10);
  const stmt = db.prepare("INSERT INTO staff (email, password_hash, display_name, created_at) VALUES (?,?,?,?)");
  const info = stmt.run(email, hash, displayName ?? null, Date.now());
  return { id: info.lastInsertRowid };
}

export async function getUserByEmail(email: string) {
  initDb();
  if (!db) return null;
  const row = db.prepare("SELECT id, email, password_hash, display_name, created_at FROM staff WHERE email = ?").get(email);
  return row || null;
}

export async function verifyPasswordForEmail(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, email: user.email, displayName: user.display_name };
}

export async function ensureDefaultUserFromEnv() {
  const envUser = process.env.STAFF_USER;
  const envPass = process.env.STAFF_PASS;
  if (!envUser || !envPass) return;
  try {
    const existing = await getUserByEmail(envUser);
    if (!existing) {
      await createUser(envUser, envPass, "Administrator");
      // eslint-disable-next-line no-console
      console.log("staff-store: created default admin user from env");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("staff-store: ensure default user failed", err);
  }
}
