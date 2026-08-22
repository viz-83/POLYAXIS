const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

/**
 * Minimal synchronous JSON file store (Phase 1 data layer).
 * Field names / ID conventions mirror a future relational schema (see docs/DataStructure.md)
 * so migration to PostgreSQL in Phase 2 requires no structural rewrite.
 */
function readCollection(name) {
  const file = filePath(name);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf-8');
  if (!raw.trim()) return [];
  return JSON.parse(raw);
}

function writeCollection(name, data) {
  const file = filePath(name);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

function readObject(name) {
  const file = filePath(name);
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, 'utf-8');
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function writeObject(name, data) {
  const file = filePath(name);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = { readCollection, writeCollection, readObject, writeObject, nowIso, DATA_DIR };
