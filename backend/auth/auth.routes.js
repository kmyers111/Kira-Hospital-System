import express from 'express';
import { login, refresh, logout, me } from './auth.controllers.js';
import { requireAuth } from './auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
