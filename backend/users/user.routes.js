import express from 'express';
import users from './user.controller.js';
import { requireAdmin, requireAuth } from '../auth/auth.middleware.js';

const router = express.Router();

router.get('/profile', requireAuth, users.getMyProfile);
router.get('/users/:userId', requireAuth, requireAdmin, users.findOne);

export default router;
