import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  patient_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  dateofbirth: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  current_status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  primary_doctor: {
    type: String,
    trim: true,
    default: '',
  },
  diseases: {
    type: [String],
    default: [],
  },
  activity_level: {
    type: String,
    trim: true,
    default: '',
  },
  allergies: {
    type: [String],
    default: [],
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
  collection: 'patients',
});

const Patient = mongoose.model('Patient', PatientSchema);
export default Patient;
