const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme123';

// ——— 1A. Verify JWT and attach decoded payload to req.user
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;   // includes id, email, name, role (if you sign it)
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
}

// ——— 1B. Check that req.user.role matches the required role
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role !== role)
      return res.status(403).json({ message: 'Forbidden: insufficient rights' });
    return next();
  };
}

module.exports = { requireAuth, requireRole };
