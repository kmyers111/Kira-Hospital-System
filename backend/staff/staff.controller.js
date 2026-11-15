import bcrypt from 'bcryptjs';
import Staff from './staff.model.js';
import User from '../users/user.model.js';

const STAFF_FIELDS = 'staff_id user_id firstname lastname department jobtitle phone officenumber';
const SALT_ROUNDS = 10;

function isOwnerOrAdmin(staff, user) {
  return user.role === 'admin' || staff.user_id.toString() === user.id;
}

export const create = async (req, res) => {
  let user;
  try {
    const {
      staff_id,
      username,
      email,
      password,
      firstname,
      lastname,
      department,
      jobtitle,
      phone,
      officenumber,
    } = req.body;

    if (
      !staff_id || !username || !email || !password || !firstname || !lastname
      || !department || !jobtitle || !phone || !officenumber
    ) {
      return res.status(400).send({
        message: 'staff_id, username, email, password, firstname, lastname, department, jobtitle, phone, and officenumber are required',
      });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });
    if (existing) {
      return res.status(409).send({ message: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: passwordHash,
      role: 'staff',
    });

    const staff = await Staff.create({
      staff_id,
      user_id: user.user_id,
      firstname,
      lastname,
      department,
      jobtitle,
      phone,
      officenumber,
    });
    return res.status(201).send({
      message: 'Staff member created successfully',
      staff,
    });
  } catch (error) {
    if (user) {
      await User.deleteOne({ user_id: user.user_id });
    }
    if (error.code === 11000) {
      return res.status(409).send({ message: 'Staff ID, username, or email already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).send({ message: 'Invalid staff data' });
    }
    return res.status(500).send({ message: 'Error creating staff member' });
  }
};

export const findOne = async (req, res) => {
  try {
    const staff = await Staff.findOne({ staff_id: req.params.staffId })
      .select(STAFF_FIELDS);
    if (!staff) {
      return res.status(404).send({ message: 'Staff member not found' });
    }
    if (!isOwnerOrAdmin(staff, req.user)) {
      return res.status(403).send({ message: 'You may only access your own staff record' });
    }
    return res.send(staff);
  } catch {
    return res.status(500).send({ message: 'Error retrieving staff member' });
  }
};

export const update = async (req, res) => {
  try {
    const { firstname, lastname, department, jobtitle, phone, officenumber } = req.body;
    if (!firstname || !lastname || !department || !jobtitle || !phone || !officenumber) {
      return res.status(400).send({
        message: 'firstname, lastname, department, jobtitle, phone, and officenumber are required',
      });
    }

    const staff = await Staff.findOneAndUpdate(
      { staff_id: req.params.staffId },
      { firstname, lastname, department, jobtitle, phone, officenumber },
      { new: true, runValidators: true },
    ).select(STAFF_FIELDS);
    if (!staff) {
      return res.status(404).send({ message: 'Staff member not found' });
    }
    return res.send(staff);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ message: 'Invalid staff data' });
    }
    return res.status(500).send({ message: 'Error updating staff member' });
  }
};

export default {
  create,
  findOne,
  update,
};
