import User from './user.model.js';
import Patient from '../patients/patient.model.js';
import Staff from '../staff/staff.model.js';

const USER_FIELDS = 'user_id username email role';

export const findOne = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.userId }).select(USER_FIELDS);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    return res.send(user);
  } catch {
    return res.status(500).send({ message: 'Error retrieving user' });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.id }).select(USER_FIELDS);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user_id: user.user_id })
        .select('patient_id firstname lastname phone');
    } else if (user.role === 'staff') {
      profile = await Staff.findOne({ user_id: user.user_id })
        .select('staff_id firstname lastname department jobtitle phone officenumber');
    }

    return res.send({
      username: user.username,
      email: user.email,
      role: user.role,
      profile,
    });
  } catch {
    return res.status(500).send({ message: 'Error retrieving profile' });
  }
};

export default {
  findOne,
  getMyProfile,
};
