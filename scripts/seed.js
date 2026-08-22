/**
 * Entry point matching the handover package layout (/scripts/seed.js).
 * The real implementation lives in /backend/scripts/seed.js so its `require()` calls
 * resolve against /backend/node_modules regardless of where this is invoked from.
 */
require('../backend/scripts/seed.js');
