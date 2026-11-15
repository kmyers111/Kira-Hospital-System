import { pipeline } from 'node:stream/promises';
import mongoose from 'mongoose';
import multer from 'multer'; //this is for handling file uploads in express and limiting
  //file size and file type
import Patient from './patient.model.js';

const MAX_FILE_SIZE = 16 * 1024 * 1024;
//This is a built in function of MongoDB for storing files, it needs to save it as 
//chunks and the file metadata in a seperate collection
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
  bucketName: 'patientDocuments',
});

const storage = {
  _handleFile(req, file, callback) {
    const upload = bucket().openUploadStream(file.originalname, {
      contentType: 'text/plain',
      metadata: { patientId: req.params.patientId },
    });

    pipeline(file.stream, upload).then(
      () => callback(null, {
        id: upload.id,
        filename: upload.filename,
        path: upload.id,
        size: upload.length,
      }),
      async (error) => {
        try {
          await upload.abort();
        } catch (abortError) {
          console.error('Patient document cleanup failed:', abortError.name);
        }
        callback(error);
      },
    );
  },
  _removeFile(req, file, callback) {
    bucket().delete(file.id || file.path).then(() => callback(null), callback);
  },
};

export const receivePatientDocument = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(req, file, callback) {
    if (!file.originalname.toLowerCase().endsWith('.txt')) {
      callback(new Error('Only .txt files are supported'));
      return;
    }
    callback(null, true);
  },
});

export const uploadPatientDocument = (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'Choose a .txt file to upload' });
  }

  return res.status(201).send({ message: 'Document uploaded successfully' });
};

export const handleDocumentUpload = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.params.patientId }).select('_id');
    if (!patient) {
      return res.status(404).send({ message: 'Patient not found' });
    }

    return receivePatientDocument.single('document')(req, res, (error) => {
      if (!error) {
        next();
        return;
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).send({ message: 'File must be 16 MB or smaller' });
        return;
      }
      if (error.message === 'Only .txt files are supported') {
        res.status(400).send({ message: error.message });
        return;
      }
      if (error instanceof multer.MulterError) {
        res.status(400).send({ message: 'Invalid upload request' });
        return;
      }

      console.error('Patient document upload failed:', error.name);
      res.status(500).send({ message: 'Unable to upload document' });
    });
  } catch (error) {
    console.error('Patient document check failed:', error.name);
    return res.status(500).send({ message: 'Unable to upload document' });
  }
};
