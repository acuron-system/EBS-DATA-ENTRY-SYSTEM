const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { queryOne, execute } = require('./db');
const { isValidUdise, getSchoolName } = require('./schools');

const JWT_SECRET = process.env.JWT_SECRET || 'deo-marthandam-super-secure-token-secret-2026';
const TOKEN_EXPIRY = '7d';

/**
 * Generate JWT token with user session payload
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Authenticate incoming HTTP request
 * Reads token from Authorization header or cookie
 */
async function authenticateToken(req, res, next) {
  let token = null;

  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check Cookie if header not present
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const cookie of cookies) {
      const [name, val] = cookie.trim().split('=');
      if (name === 'auth_token') {
        token = decodeURIComponent(val);
        break;
      }
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
  }
}

/**
 * Require 'admin' role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Administrator privilege required.' });
  }
  next();
}

/**
 * Require 'school' role
 */
function requireSchool(req, res, next) {
  if (!req.user || req.user.role !== 'school') {
    return res.status(403).json({ success: false, message: 'Access denied: School user privilege required.' });
  }
  next();
}

/**
 * Core Login Authenticator
 * Handles both:
 * 1. Admin login (username: admin, password: Admin@DEO2026 or env)
 * 2. School login (username: 11-digit UDISE, password: <UDISE>@123)
 */
async function loginUser(username, password) {
  const trimmedUser = String(username || '').trim();
  const rawPass = String(password || '');

  if (!trimmedUser || !rawPass) {
    return { success: false, message: 'Username and password are required.' };
  }

  // Check if Admin Login
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  if (trimmedUser.toLowerCase() === adminUsername.toLowerCase()) {
    const user = await queryOne('SELECT * FROM users WHERE username = $1', [adminUsername]);
    if (!user) {
      return { success: false, message: 'Admin account not initialized.' };
    }

    const isMatch = await bcrypt.compare(rawPass, user.password_hash);
    if (!isMatch) {
      return { success: false, message: 'Invalid administrator credentials.' };
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: 'admin',
      schoolUdise: null,
      schoolName: 'District Educational Office (Admin)'
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: 'admin',
        schoolUdise: null,
        schoolName: 'District Educational Office (Admin)'
      }
    };
  }

  // School Login
  if (!/^\d{10,11}$/.test(trimmedUser)) {
    return { success: false, message: 'School login requires a valid 10 or 11-digit UDISE Code.' };
  }

  if (!isValidUdise(trimmedUser)) {
    return { success: false, message: `UDISE Code "${trimmedUser}" is not registered in the district directory.` };
  }

  const schoolName = getSchoolName(trimmedUser);

  // Check if school user has an existing custom user record
  const existingUser = await queryOne('SELECT * FROM users WHERE username = $1', [trimmedUser]);

  let isAuthenticated = false;
  let userId = existingUser ? existingUser.id : null;

  if (existingUser) {
    isAuthenticated = await bcrypt.compare(rawPass, existingUser.password_hash);
  } else {
    // Default official institutional password pattern: <UDISE_Code>@123
    const defaultExpectedPassword = `${trimmedUser}@123`;
    if (rawPass === defaultExpectedPassword) {
      isAuthenticated = true;
      // Lazily create user record with hashed password
      userId = `usr_sch_${trimmedUser}`;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(rawPass, salt);
      try {
        await execute(
          'INSERT INTO users (id, username, password_hash, role, school_udise) VALUES ($1, $2, $3, $4, $5)',
          [userId, trimmedUser, hash, 'school', trimmedUser]
        );
      } catch (e) {
        // Ignore if already inserted concurrently
      }
    }
  }

  if (!isAuthenticated) {
    return {
      success: false,
      message: 'Incorrect password. Format must be <UDISE_Code>@123 (e.g., ' + trimmedUser + '@123).'
    };
  }

  const token = generateToken({
    id: userId || `usr_sch_${trimmedUser}`,
    username: trimmedUser,
    role: 'school',
    schoolUdise: trimmedUser,
    schoolName: schoolName
  });

  return {
    success: true,
    token,
    user: {
      id: userId || `usr_sch_${trimmedUser}`,
      username: trimmedUser,
      role: 'school',
      schoolUdise: trimmedUser,
      schoolName: schoolName
    }
  };
}

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireSchool,
  loginUser
};

