/**
 * In-memory record of when each user last made an authenticated request — drives the
 * "active sessions" figure on the Admin Panel (ADMIN-09). A session counts as active while its last
 * request is within the inactivity timeout. Resets on server restart (fine for Phase 1).
 */
const lastSeen = new Map(); // userId -> epoch ms

function touch(userId) {
  lastSeen.set(userId, Date.now());
}

function forget(userId) {
  lastSeen.delete(userId);
}

function activeCount(windowSeconds) {
  const cutoff = Date.now() - windowSeconds * 1000;
  let count = 0;
  for (const [id, ts] of lastSeen) {
    if (ts >= cutoff) count += 1;
    else lastSeen.delete(id);
  }
  return count;
}

module.exports = { touch, forget, activeCount };
