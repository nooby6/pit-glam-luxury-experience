#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_USER || process.env.SUDO_USER || process.env.STAFF_USER;
  const pass = args[1] || process.env.ADMIN_PASS || process.env.SUDO_PASS || process.env.STAFF_PASS;

  if (!email || !pass) {
    console.error("Usage: node scripts/create-admin.js <email> <password>");
    console.error("Or set ADMIN_USER / ADMIN_PASS (or SUDO_USER / SUDO_PASS, or STAFF_USER / STAFF_PASS).");
    process.exit(1);
  }

  const DB_PATH = process.env.STAFF_DB_PATH || path.join(process.cwd(), "data", "pitglam.sqlite");
  const initSqlJs = await import("sql.js");
  const SQL = await (typeof initSqlJs.default === "function" ? initSqlJs.default() : initSqlJs.default);

  let db;
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at INTEGER NOT NULL
      );
    `);
  }

  const hash = await bcrypt.hash(pass, 10);
  try {
    const existing = db.prepare("SELECT id FROM staff WHERE email = ?");
    const row = existing.getAsObject([email]);
    existing.free();

    if (row && row.id) {
      const update = db.prepare("UPDATE staff SET password_hash = ?, display_name = ?, created_at = ? WHERE email = ?");
      update.run([hash, "Administrator", Date.now(), email]);
      update.free();
      console.log("Admin updated:", email);
    } else {
      const stmt = db.prepare("INSERT INTO staff (email, password_hash, display_name, created_at) VALUES (?,?,?,?)");
      stmt.run([email, hash, "Administrator", Date.now()]);
      stmt.free();
      console.log("Admin created:", email);
    }

    const data = db.export();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error("Failed to create admin:", err?.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
