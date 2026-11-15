import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../users/user.model.js';
import RefreshSession from './refresh-session.model.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, config.accessTokenSecret);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (!payload || typeof payload === 'string' || !payload.id || !payload.sid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const [session, user] = await Promise.all([
      RefreshSession.findOne({
        tokenId: payload.sid,
        userId: payload.id,
        expiresAt: { $gt: new Date() },
      }),
      User.findOne({ user_id: payload.id }),
    ]);

    if (!session || !user) {
      if (session && !user) {
        await RefreshSession.deleteOne({ tokenId: payload.sid });
      }
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: user.user_id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (error) {
    console.error('Authentication check failed:', error.name);
    return res.status(500).json({ error: 'Unable to verify authentication' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
};

export const requireStaffOrAdmin = (req, res, next) => {
  if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff access required' });
  }

  return next();
};
