import fs from "fs/promises";
import path from "path";

let SQL: any = null;
let db: any = null;
let dbPath: string | undefined;

async function initSqlite() {
  if (db) return;
  if (!SQL) {
    // sql.js default export is an async initializer in Node/SSR.
    const mod = await import("sql.js");
    const initSqlJs = (mod as any).default ?? mod;
    SQL = typeof initSqlJs === "function" ? await initSqlJs() : initSqlJs;
  }

  dbPath = process.env.STAFF_DB_PATH ?? path.resolve(process.cwd(), "data", "pitglam.sqlite");
  // ensure data directory exists
  try {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
  } catch (err) {
    // ignore
  }

  try {
    const exists = await fs.stat(dbPath).then(() => true).catch(() => false);
    if (exists) {
      const bytes = await fs.readFile(dbPath);
      db = new SQL.Database(new Uint8Array(bytes));
    } else {
      db = new SQL.Database();
      // create table
      db.exec(`CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at INTEGER NOT NULL
      );`);
      await persist();
    }
  } catch (err) {
    // If DB can't be initialized, set db to null and surface errors to callers
    // eslint-disable-next-line no-console
    console.error("staff-store init error:", err);
    db = null;
  }
}

function getSeedCredentials() {
  const user = process.env.ADMIN_USER ?? process.env.SUDO_USER ?? process.env.STAFF_USER;
  const pass = process.env.ADMIN_PASS ?? process.env.SUDO_PASS ?? process.env.STAFF_PASS;
  return { user, pass };
}

async function persist() {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    await fs.writeFile(dbPath, Buffer.from(data));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("staff-store persist error:", err);
  }
}

export async function createUser(email: string, password: string, displayName?: string) {
  await initSqlite();
  if (!db) throw new Error("staff-store unavailable");
  // Load bcrypt dynamically to avoid bundling/server-resolve issues in some runtimes
  let bcrypt: any;
  try {
    const mod = await import("bcryptjs");
    bcrypt = mod && (mod.default ?? mod);
  } catch (err) {
    throw new Error("bcryptjs not available: " + String(err));
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const stmt = db.prepare("INSERT INTO staff (email, password_hash, display_name, created_at) VALUES (?,?,?,?)");
    stmt.run([email, hash, displayName ?? null, Date.now()]);
    stmt.free();
    // get last id
    const res = db.exec("SELECT last_insert_rowid() as id");
    await persist();
    const id = (res && res[0] && res[0].values && res[0].values[0] && res[0].values[0][0]) || null;
    return { id };
  } catch (err: any) {
    if (err && /UNIQUE constraint failed/.test(String(err.message || err))) {
      throw new Error("User already exists");
    }
    throw err;
  }
}

export async function getUserByEmail(email: string) {
  await initSqlite();
  if (!db) return null;
  try {
    const stmt = db.prepare("SELECT id, email, password_hash, display_name, created_at FROM staff WHERE email = ?");
    const ok = stmt.getAsObject([email]);
    stmt.free();
    if (!ok || !ok.email) return null;
    return ok;
  } catch (err) {
    return null;
  }
}

export async function verifyPasswordForEmail(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  let bcrypt: any;
  try {
    const mod = await import("bcryptjs");
    bcrypt = mod && (mod.default ?? mod);
  } catch (err) {
    throw new Error("bcryptjs not available: " + String(err));
  }
  const ok = await bcrypt.compare(password, user.password_hash as string);
  if (!ok) return null;
  return { id: user.id, email: user.email, displayName: user.display_name };
}

export async function ensureDefaultUserFromEnv() {
  const { user: envUser, pass: envPass } = getSeedCredentials();
  if (!envUser || !envPass) return;
  try {
    const existing = await getUserByEmail(envUser);
    if (!existing) {
      await createUser(envUser, envPass, "Administrator");
      // eslint-disable-next-line no-console
      console.log("staff-store: created default admin user from env aliases");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("staff-store: ensure default user failed", err);
  }
}
