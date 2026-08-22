const bcrypt = require('bcryptjs');
const { readCollection } = require('../utils/dataStore');
const { ApiError } = require('../middleware/errorHandler');
const { issueToken } = require('../middleware/auth');

/** AuthService — credential verification and session token issuance (Module 1). */
class AuthService {
  login(email, password) {
    const users = readCollection('users');
    const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

    // AUTH-04: identical error for unknown email vs. wrong password — no detail leak.
    const genericError = () => new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

    if (!user) throw genericError();

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) throw genericError();

    const token = issueToken(user);
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}

module.exports = new AuthService();
