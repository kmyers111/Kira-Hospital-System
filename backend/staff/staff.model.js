import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  staff_id: {
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
  department: {
    type: String,
    required: true,
    trim: true,
  },
  jobtitle: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  officenumber: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
  collection: 'staff',
});

const Staff = mongoose.model('Staff', StaffSchema);
export default Staff;
