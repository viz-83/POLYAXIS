/**
 * First-boot seeding for hosted deployments (used by `npm start`).
 *
 * The JSON data files are not committed, so a fresh deploy starts with an empty data directory.
 * This seeds the baseline demo data ONLY when no users exist yet. It never touches an existing data
 * directory — important on Render, where DATA_DIR points at a persistent disk that must survive
 * restarts and redeploys. (`npm run seed` is the explicit "wipe and reset" command.)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');

function hasUsers() {
  try {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    return Array.isArray(users) && users.length > 0;
  } catch {
    return false;
  }
}

if (hasUsers()) {
  console.log(`[ensure-seed] Data found in ${dataDir} — leaving it untouched.`);
} else {
  console.log(`[ensure-seed] No data in ${dataDir} — seeding the baseline demo data…`);
  fs.mkdirSync(dataDir, { recursive: true });
  const result = spawnSync(process.execPath, [path.join(__dirname, 'seed.js')], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error('[ensure-seed] Seeding failed — refusing to start with an empty data directory.');
    process.exit(result.status || 1);
  }
}
