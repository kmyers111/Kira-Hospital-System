import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiBaseUrl, useAuth } from '../AuthContext.jsx';
import './PatientLookup.css';
import './PatientProfile.css';

function showValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'None recorded';
  }
  return value || 'Not recorded';
}

function PatientProfile() {
  const { patientId } = useParams();
  const { user, authenticatedGet, authenticatedPost, authenticatedPut } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patientForm, setPatientForm] = useState(null);
  const [documentError, setDocumentError] = useState('');
  const [uploading, setUploading] = useState(false);
  const canUpdate = ['staff', 'admin'].includes(user?.role);

  useEffect(() => {
    let active = true;
    async function getPatient() {
      try {
        setLoading(true);
        const response = await authenticatedGet(
          `${getApiBaseUrl()}/api/patients/${encodeURIComponent(patientId)}`,
        );
        if (active) {
          setPatient(response.data);
          setError('');
        }
      } catch {
        if (active) {
          setError('Unable to load this patient profile.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    getPatient();
    return () => {
      active = false;
    };
  }, [authenticatedGet, patientId]);

  const handleEdit = () => {
    setPatientForm({
      firstname: patient.firstname,
      lastname: patient.lastname,
      dateofbirth: patient.dateofbirth,
      phone: patient.phone,
      address: patient.address,
      current_status: patient.current_status || 'active',
      primary_doctor: patient.primary_doctor || '',
      diseases: (patient.diseases || []).join(', '),
      activity_level: patient.activity_level || '',
      allergies: (patient.allergies || []).join(', '),
      notes: patient.notes || '',
    });
    setUpdateError('');
    setEditing(true);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setUpdateError('');
    try {
      const response = await authenticatedPut(
        `${getApiBaseUrl()}/api/patients/${encodeURIComponent(patientId)}`,
        patientForm,
      );
      setPatient(response.data);
      setEditing(false);
    } catch (updatePatientError) {
      setUpdateError(
        updatePatientError?.response?.data?.message || 'Unable to update patient information.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.document.files[0];
    if (!file) {
      setDocumentError('Choose a document to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    setUploading(true);
    setDocumentError('');
    try {
      await authenticatedPost(
        `${getApiBaseUrl()}/api/patients/${encodeURIComponent(patientId)}/documents`,
        formData,
      );
      form.reset();
    } catch (uploadError) {
      setDocumentError(
        uploadError?.response?.data?.message || 'Unable to upload this document.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="portal-page">
      <header className="portal-header">
        <div className="patient-profile-header">
          <Link className="portal-button patient-exit-button" to="/">
            Exit
          </Link>
          <h1 className="portal-brand">Kira Hospital System</h1>
        </div>
      </header>

      <div className="portal-content patient-profile-content">
        {loading && <p role="status">Loading patient profile...</p>}
        {error && <p className="portal-error" role="alert">{error}</p>}

        {patient && (
          <>
            <section className="patient-profile-section" aria-labelledby="patient-title">
              <div className="patient-profile-title">
                <h2 id="patient-title">{patient.firstname} {patient.lastname}</h2>
                {canUpdate && !editing && (
                  <button className="portal-button" onClick={handleEdit} type="button">
                    Update patient
                  </button>
                )}
              </div>
              {editing ? (
                <form className="patient-update-form" onSubmit={handleUpdate}>
                  <label>
                    Patient ID
                    <input value={patient.patient_id} disabled />
                  </label>
                  <label>
                    First name
                    <input name="firstname" onChange={(event) => setPatientForm({ ...patientForm, firstname: event.target.value })} required value={patientForm.firstname} />
                  </label>
                  <label>
                    Last name
                    <input name="lastname" onChange={(event) => setPatientForm({ ...patientForm, lastname: event.target.value })} required value={patientForm.lastname} />
                  </label>
                  <label>
                    Date of birth
                    <input name="dateofbirth" onChange={(event) => setPatientForm({ ...patientForm, dateofbirth: event.target.value })} required type="date" value={patientForm.dateofbirth} />
                  </label>
                  <label>
                    Phone
                    <input name="phone" onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })} required value={patientForm.phone} />
                  </label>
                  <label>
                    Address
                    <input name="address" onChange={(event) => setPatientForm({ ...patientForm, address: event.target.value })} required value={patientForm.address} />
                  </label>
                  <label>
                    Current status
                    <select name="current_status" onChange={(event) => setPatientForm({ ...patientForm, current_status: event.target.value })} value={patientForm.current_status}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label>
                    Primary doctor
                    <input name="primary_doctor" onChange={(event) => setPatientForm({ ...patientForm, primary_doctor: event.target.value })} value={patientForm.primary_doctor} />
                  </label>
                  <label>
                    Diseases (comma separated)
                    <input name="diseases" onChange={(event) => setPatientForm({ ...patientForm, diseases: event.target.value })} value={patientForm.diseases} />
                  </label>
                  <label>
                    Activity level
                    <input name="activity_level" onChange={(event) => setPatientForm({ ...patientForm, activity_level: event.target.value })} value={patientForm.activity_level} />
                  </label>
                  <label>
                    Allergies (comma separated)
                    <input name="allergies" onChange={(event) => setPatientForm({ ...patientForm, allergies: event.target.value })} value={patientForm.allergies} />
                  </label>
                  <label className="patient-update-notes">
                    Notes
                    <textarea name="notes" onChange={(event) => setPatientForm({ ...patientForm, notes: event.target.value })} rows="4" value={patientForm.notes} />
                  </label>
                  {updateError && <p className="portal-error patient-update-error" role="alert">{updateError}</p>}
                  <div className="patient-update-actions">
                    <button className="portal-button" disabled={saving} type="submit">
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button className="portal-button" disabled={saving} onClick={() => setEditing(false)} type="button">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="health-record-details">
                  <div><dt>Patient ID</dt><dd>{patient.patient_id}</dd></div>
                  <div><dt>First name</dt><dd>{patient.firstname}</dd></div>
                  <div><dt>Last name</dt><dd>{patient.lastname}</dd></div>
                  <div><dt>Date of birth</dt><dd>{patient.dateofbirth}</dd></div>
                  <div><dt>Phone</dt><dd>{patient.phone}</dd></div>
                  <div><dt>Address</dt><dd>{patient.address}</dd></div>
                  <div><dt>Current status</dt><dd>{patient.current_status || 'Active'}</dd></div>
                  <div><dt>Primary doctor</dt><dd>{showValue(patient.primary_doctor)}</dd></div>
                  <div><dt>Diseases</dt><dd>{showValue(patient.diseases)}</dd></div>
                  <div><dt>Activity level</dt><dd>{showValue(patient.activity_level)}</dd></div>
                  <div><dt>Allergies</dt><dd>{showValue(patient.allergies)}</dd></div>
                  <div className="patient-notes"><dt>Notes</dt><dd>{showValue(patient.notes)}</dd></div>
                </dl>
              )}
            </section>

            <section className="patient-profile-section" aria-labelledby="documents-title">
              <h2 id="documents-title">Documents</h2>
              <form className="patient-document-upload" onSubmit={handleUpload}>
                <input
                  accept=".txt,text/plain"
                  id="patient-document"
                  name="document"
                  type="file"
                  aria-label="Choose a document"
                />
                <button className="portal-button" disabled={uploading} type="submit">
                  {uploading ? 'Uploading...' : 'Upload document'}
                </button>
              </form>
              {documentError && <p className="portal-error" role="alert">{documentError}</p>}
            </section>
          </>
        )}
      </div>

    </main>
  );
}

export default PatientProfile;
