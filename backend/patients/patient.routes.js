import express from 'express';
import patients from './patient.controller.js';
import {
  requireAuth,
  requireStaffOrAdmin,
} from '../auth/auth.middleware.js';
import {
  handleDocumentUpload,
  uploadPatientDocument,
} from './patient.documents.js';

const router = express.Router();

router.get('/patients/search', requireAuth, requireStaffOrAdmin, patients.search);
router.get('/patients/me', requireAuth, patients.findMine);
router.post('/patients/:patientId/documents', requireAuth, requireStaffOrAdmin, handleDocumentUpload, uploadPatientDocument);
router.get('/patients/:patientId', requireAuth, patients.findOne);
router.put('/patients/:patientId', requireAuth, requireStaffOrAdmin, patients.update);

export default router;
