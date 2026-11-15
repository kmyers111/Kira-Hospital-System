import express from 'express';
import staff from './staff.controller.js';
import { requireAdmin, requireAuth } from '../auth/auth.middleware.js';

const router = express.Router();

router.post('/staff', requireAuth, requireAdmin, staff.create);
router.get('/staff/:staffId', requireAuth, staff.findOne);
router.put('/staff/:staffId', requireAuth, requireAdmin, staff.update);

export default router;
