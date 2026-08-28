const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const crypto = require('crypto');
const config = require('../config');
const tokenService = require('../services/token.service');
const prisma = require('../utils/prisma');

const EXPECTED_ISSUER = config.lockmcpIssuer || process.env.LOCKMCP_ISSUER || '';

// Initialize JWKS client only if issuer is configured or dynamically on demand
let jwks = null;
function getJwksClient(issuer) {
  const iss = issuer || EXPECTED_ISSUER;
  if (!iss) return null;
  return jwksClient({
    jwksUri: `${iss.replace(/\/+$/, '')}/protocol/openid-connect/certs`,
    cache: true,
    cacheMaxAge: 10 * 60 * 1000, // 10 minutes cache
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });
}

if (EXPECTED_ISSUER) {
  jwks = getJwksClient(EXPECTED_ISSUER);
}

function getKey(header, callback) {
  if (!jwks) {
    return callback(new Error('LockMCP JWKS client not configured. Set LOCKMCP_ISSUER environment variable.'));
  }
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key ? (key.getPublicKey() || key.rsaPublicKey) : null;
    callback(null, signingKey);
  });
}

/**
 * Verifies standard LockMCP / AuthIO Identity Brokering forwarded RS256 token.
 */
function verifyLockMcpToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Missing bearer token'
    });
  }

  if (!EXPECTED_ISSUER) {
    return res.status(401).json({
      success: false,
      message: 'LOCKMCP_ISSUER is not configured on this server'
    });
  }

  jwt.verify(
    token,
    getKey,
    { algorithms: ['RS256'], issuer: EXPECTED_ISSUER },
    async (err, decoded) => {
      if (err || !decoded || !decoded.sub || !decoded.exp) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      req.lockMcpUserId = decoded.sub;

      // Determine user role from token claims if present (defaults to AGENT)
      const roles = decoded.realm_access?.roles || decoded.roles || [];
      let role = 'AGENT';
      if (roles.includes('ADMIN') || roles.includes('admin') || roles.includes('ROLE_ADMIN')) {
        role = 'ADMIN';
      } else if (roles.includes('CLIENT') || roles.includes('client') || roles.includes('ROLE_CLIENT')) {
        role = 'CLIENT';
      }

      // Resolve (find-or-create) the local user row this LockMCP identity maps
      // to. Foreign keys like Property.agentId reference our own `users` table,
      // not Keycloak — req.user.id must always be a real local id, never the
      // raw `sub`, or every write referencing it fails its FK constraint.
      //
      // Keyed on `email` (already @unique on User) rather than adding a new
      // column — no schema change needed. If someone already has a local
      // password-based account under this same email, that row is reused as-is
      // (same person, one identity) rather than creating a duplicate.
      const lockMcpEmail = decoded.email || decoded.preferred_username || `${decoded.sub}@lockmcp.local`;
      try {
        const localUser = await prisma.user.upsert({
          where: { email: lockMcpEmail },
          update: {},
          create: {
            email: lockMcpEmail,
            password: crypto.randomUUID(), // never used to log in locally
            firstName: decoded.given_name || 'LockMCP',
            lastName: decoded.family_name || 'User',
            role,
          },
        });

        req.user = {
          id: localUser.id,
          email: localUser.email,
          role,
          lockMcpUserId: decoded.sub,
          claims: decoded
        };

        next();
      } catch (dbErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to resolve local user for LockMCP identity'
        });
      }
    }
  );
}

/**
 * Unified Authentication Middleware:
 * Supports both LockMCP RS256 tokens (Identity Brokering) and local HS256 tokens (Portal/Swagger login).
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Missing or invalid token format.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const unverified = jwt.decode(token, { complete: true });
    
    // If token is RS256 (LockMCP / AuthIO) or issuer matches LOCKMCP_ISSUER
    if (unverified && unverified.header && unverified.header.alg === 'RS256') {
      return verifyLockMcpToken(req, res, next);
    }

    // Default: Local application JWT token verification (HS256)
    const decoded = tokenService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

module.exports = {
  authenticate,
  verifyLockMcpToken
};
