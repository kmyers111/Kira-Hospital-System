import Patient from './patient.model.js';

const PATIENT_FIELDS = 'patient_id user_id firstname lastname dateofbirth phone address current_status primary_doctor diseases activity_level allergies notes';

function isOwnerOrAdmin(patient, user) {
  return user.role === 'admin' || patient.user_id.toString() === user.id;
}
//This is a built in function of MongoDB for a search feature in its databases
export const search = async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  if (!query) {
    return res.json([]);
  }

  try {
    const patients = await Patient.aggregate([
      {
        $search: {
          index: 'patient_search',
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: 'firstname',
                },
              },
              {
                autocomplete: {
                  query,
                  path: 'lastname',
                },
              },
              {
                text: {
                  query,
                  path: 'patient_id',
                },
              },
            ],
            minimumShouldMatch: 1,
          },
        },
      },
      { $limit: 20 },
      {
        $project: {
          patient_id: 1,
          firstname: 1,
          lastname: 1,
          dateofbirth: 1,
          phone: 1,
          address: 1,
          score: { $meta: 'searchScore' },
        },
      },
    ]);
    return res.send(patients);
  } catch (error) {
    console.error('Atlas patient search failed:', error.name);
    return res.status(500).send({ message: 'Error searching patients' });
  }
};

export const findMine = async (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).send({ message: 'Patient access required' });
  }

  try {
    const patient = await Patient.findOne({ user_id: req.user.id })
      .select(PATIENT_FIELDS);
    if (!patient) {
      return res.status(404).send({ message: 'Patient record not found' });
    }
    return res.send(patient);
  } catch {
    return res.status(500).send({ message: 'Error retrieving patient record' });
  }
};

export const findOne = async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.params.patientId })
      .select(PATIENT_FIELDS);
    if (!patient) {
      return res.status(404).send({ message: 'Patient not found' });
    }
    if (!['admin', 'staff'].includes(req.user.role) && !isOwnerOrAdmin(patient, req.user)) {
      return res.status(403).send({ message: 'You may only access your own patient record' });
    }
    return res.send(patient);
  } catch {
    return res.status(500).send({ message: 'Error retrieving patient' });
  }
};

export const update = async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.params.patientId });
    if (!patient) {
      return res.status(404).send({ message: 'Patient not found' });
    }
    const {
      firstname,
      lastname,
      dateofbirth,
      phone,
      address,
      current_status,
      primary_doctor,
      diseases,
      activity_level,
      allergies,
      notes,
    } = req.body;

    if (!firstname || !lastname || !dateofbirth || !phone || !address) {
      return res.status(400).send({ message: 'Name, date of birth, phone, and address are required' });
    }

    const toList = (value) => (
      Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean)
        : String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
    );

    patient.firstname = firstname;
    patient.lastname = lastname;
    patient.dateofbirth = dateofbirth;
    patient.phone = phone;
    patient.address = address;
    patient.current_status = current_status || 'active';
    patient.primary_doctor = primary_doctor || '';
    patient.diseases = toList(diseases);
    patient.activity_level = activity_level || '';
    patient.allergies = toList(allergies);
    patient.notes = notes || '';
    await patient.save();
    return res.send(patient);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({ message: 'Invalid patient data' });
    }
    return res.status(500).send({ message: 'Error updating patient' });
  }
};

export default {
  search,
  findMine,
  findOne,
  update,
};
