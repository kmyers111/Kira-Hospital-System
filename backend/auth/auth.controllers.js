import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import User from '../users/user.model.js';
import RefreshSession from './refresh-session.model.js';
import { config } from '../config.js';

const ACCESS_TOKEN_LIFE = '15m';
const REFRESH_TOKEN_MS = 2 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: config.cookieSameSite,
  secure: config.cookieSecure,
};

const generateAccessToken = (payload, tokenId) =>
  jwt.sign({ ...payload, sid: tokenId }, config.accessTokenSecret, {
    expiresIn: ACCESS_TOKEN_LIFE,
  });

const hashRefreshToken = (token) => createHash('sha256').update(token).digest('hex');
const isRefreshToken = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/i.test(token);

const tokenPayloadForUser = (user) => ({
  id: user.user_id.toString(),
  username: user.username,
  email: user.email,
  role: user.role,
});

export const login = async (req, res) => {
  try {
    const username = req.body.username ?? req.body.user_name;
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({
      username: String(username).trim().toLowerCase(),
    }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const payload = tokenPayloadForUser(user);
    const refreshToken = randomBytes(32).toString('hex');
    const tokenId = hashRefreshToken(refreshToken);
    await RefreshSession.create({
      tokenId,
      userId: user.user_id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
    });
    const accessToken = generateAccessToken(payload, tokenId);

    res.cookie('refreshToken', refreshToken, {
      ...refreshCookieOptions,
      maxAge: REFRESH_TOKEN_MS,
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Login failed:', error.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.sendStatus(401);
  }

  if (!isRefreshToken(refreshToken)) {
    res.clearCookie('refreshToken', refreshCookieOptions);
    return res.sendStatus(403);
  }

  try {
    const session = await RefreshSession.findOne({
      tokenId: hashRefreshToken(refreshToken),
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      res.clearCookie('refreshToken', refreshCookieOptions);
      return res.sendStatus(403);
    }

    const user = await User.findOne({ user_id: session.userId });
    if (!user) {
      await RefreshSession.deleteOne({ tokenId: session.tokenId });
      res.clearCookie('refreshToken', refreshCookieOptions);
      return res.sendStatus(401);
    }

    return res.json({
      accessToken: generateAccessToken(tokenPayloadForUser(user), session.tokenId),
    });
  } catch (error) {
    console.error('Token refresh failed:', error.name);
    return res.status(500).json({ error: 'Unable to refresh access token' });
  }
};

export const me = (req, res) => res.status(200).json(req.user);

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.clearCookie('refreshToken', refreshCookieOptions);
    return res.sendStatus(204);
  }

  if (!isRefreshToken(refreshToken)) {
    res.clearCookie('refreshToken', refreshCookieOptions);
    return res.sendStatus(204);
  }

  try {
    await RefreshSession.deleteOne({ tokenId: hashRefreshToken(refreshToken) });
    res.clearCookie('refreshToken', refreshCookieOptions);
    return res.sendStatus(204);
  } catch (error) {
    res.clearCookie('refreshToken', refreshCookieOptions);
    console.error('Logout failed:', error.name);
    return res.status(500).json({ error: 'Unable to end server session' });
  }
};
