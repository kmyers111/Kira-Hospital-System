import { useEffect, useState } from 'react';
import { getApiBaseUrl, useAuth } from '../AuthContext.jsx';
import { Link } from 'react-router-dom';
import './PatientLookup.css';

function PatientLookup() {
  const { user, authenticatedGet, logout } = useAuth();
  const isPatient = user?.role === 'patient';
  const canSearchPatients = user?.role === 'staff' || user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthRecord, setHealthRecord] = useState(null);
  const [healthRecordError, setHealthRecordError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const searchTerm = search.trim();
    if (!canSearchPatients || !searchTerm) {
      return undefined;
    }

    let active = true;
    const delay = setTimeout(() => {
      async function getResults() {
        try {
          setLoading(true);
          setError('');
          const response = await authenticatedGet(
            `${getApiBaseUrl()}/api/patients/search?q=${encodeURIComponent(searchTerm)}`,
          );
          if (active) {
            setResults(response.data);
            setHasSearched(true);
          }
        } catch {
          if (active) {
            setError('Unable to retrieve search results.');
            setResults([]);
            setHasSearched(false);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      getResults();
    }, 300);

    return () => {
      active = false;
      clearTimeout(delay);
    };
  }, [authenticatedGet, canSearchPatients, search]);

  useEffect(() => {
    if (!isPatient) {
      return undefined;
    }

    let active = true;
    authenticatedGet(`${getApiBaseUrl()}/api/patients/me`)
      .then((response) => {
        if (active) {
          setHealthRecord(response.data);
          setHealthRecordError('');
        }
      })
      .catch(() => {
        if (active) {
          setHealthRecordError('Unable to load your health record.');
        }
      });

    return () => {
      active = false;
    };
  }, [authenticatedGet, isPatient]);

  useEffect(() => {
    if (!profileOpen) {
      return undefined;
    }

    let active = true;
    authenticatedGet(`${getApiBaseUrl()}/api/profile`)
      .then((response) => {
        if (active) {
          setProfile(response.data);
        }
      })
      .catch(() => {
        if (active) {
          setProfileError('Unable to load your profile.');
        }
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authenticatedGet, profileOpen]);

  if (!isPatient && !canSearchPatients) {
    return (
      <main className="portal-denied">
        <p role="alert">You do not have access to this page.</p>
        <button className="portal-button" type="button" onClick={logout}>
          Log out
        </button>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <div className="portal-header-main">
          <h1 className="portal-brand">Kira Hospital System</h1>
          <nav className="portal-tabs" aria-label="Main navigation">
            <span className="portal-tab" aria-current="page">
              {isPatient ? 'Health Record' : 'Patient Lookup'}
            </span>
          </nav>
          <div className="portal-profile">
            <button
              aria-expanded={profileOpen}
              aria-haspopup="dialog"
              className="portal-button portal-profile-button"
              onClick={() => {
                if (profileOpen) {
                  setProfileOpen(false);
                  return;
                }
                setProfileLoading(true);
                setProfileError('');
                setProfileOpen(true);
              }}
              type="button"
            >
              Profile
            </button>
            {profileOpen && (
              <section
                aria-label="Your profile"
                className="profile-popover"
                role="dialog"
              >
                {profileLoading && <p role="status">Loading profile...</p>}
                {profileError && <p className="portal-error" role="alert">{profileError}</p>}
                {profile && (
                  <dl className="profile-details">
                    <div><dt>Name</dt><dd>{[profile.profile?.firstname, profile.profile?.lastname].filter(Boolean).join(' ') || profile.username}</dd></div>
                    <div><dt>Username</dt><dd>{profile.username}</dd></div>
                    <div><dt>Email</dt><dd>{profile.email}</dd></div>
                    <div><dt>Role</dt><dd>{profile.role}</dd></div>
                    {profile.profile?.patient_id && <div><dt>Patient ID</dt><dd>{profile.profile.patient_id}</dd></div>}
                    {profile.profile?.staff_id && <div><dt>Staff ID</dt><dd>{profile.profile.staff_id}</dd></div>}
                    {profile.profile?.department && <div><dt>Department</dt><dd>{profile.profile.department}</dd></div>}
                    {profile.profile?.jobtitle && <div><dt>Job title</dt><dd>{profile.profile.jobtitle}</dd></div>}
                    {profile.profile?.phone && <div><dt>Phone</dt><dd>{profile.profile.phone}</dd></div>}
                    {profile.profile?.officenumber && <div><dt>Office</dt><dd>{profile.profile.officenumber}</dd></div>}
                  </dl>
                )}
                <button className="portal-button profile-logout-button" onClick={() => logout()} type="button">
                  Logout
                </button>
              </section>
            )}
          </div>
        </div>
      </header>

      {canSearchPatients && (
        <section className="portal-content" aria-label="Patient search">
          <label className="visually-hidden" htmlFor="patient-search">
            Search by patient name or ID
          </label>
          <input
            autoComplete="off"
            className="patient-search-input"
            id="patient-search"
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              if (!value.trim()) {
                setResults([]);
                setHasSearched(false);
                setError('');
                setLoading(false);
              }
            }}
            placeholder="Search patients by name or ID"
            type="search"
            value={search}
          />

          {error && <p className="portal-error" role="alert">{error}</p>}
          {!loading && hasSearched && results.length === 0 && !error && (
            <p className="search-empty" role="status">No patients found.</p>
          )}
          {loading && <p role="status">Searching...</p>}
          {results.length > 0 && (
            <div className="patient-results">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Patient ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Date of birth</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Address</th>
                    <th scope="col">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((patient) => (
                    <tr key={patient.patient_id}>
                      <td>{patient.patient_id}</td>
                      <td>{patient.firstname} {patient.lastname}</td>
                      <td>{patient.dateofbirth}</td>
                      <td>{patient.phone}</td>
                      <td>{patient.address}</td>
                      <td>
                        <Link className="portal-button patient-view-button" to={`/patients/${encodeURIComponent(patient.patient_id)}`}>
                          View patient
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {isPatient && (
        <section className="portal-content health-record" aria-labelledby="health-record-title">
          <h2 id="health-record-title">Health Record</h2>
          {healthRecordError && <p className="portal-error" role="alert">{healthRecordError}</p>}
          {!healthRecord && !healthRecordError && <p role="status">Loading health record...</p>}
          {healthRecord && (
            <dl className="health-record-details">
              <div><dt>Patient ID</dt><dd>{healthRecord.patient_id}</dd></div>
              <div><dt>First name</dt><dd>{healthRecord.firstname}</dd></div>
              <div><dt>Last name</dt><dd>{healthRecord.lastname}</dd></div>
              <div><dt>Date of birth</dt><dd>{healthRecord.dateofbirth}</dd></div>
              <div><dt>Phone</dt><dd>{healthRecord.phone}</dd></div>
              <div><dt>Address</dt><dd>{healthRecord.address}</dd></div>
              <div><dt>Current status</dt><dd>{healthRecord.current_status || 'Active'}</dd></div>
              <div><dt>Primary doctor</dt><dd>{healthRecord.primary_doctor || 'Not recorded'}</dd></div>
              <div>
                <dt>Diseases</dt>
                <dd>{healthRecord.diseases?.length ? healthRecord.diseases.join(', ') : 'None recorded'}</dd>
              </div>
              <div><dt>Activity level</dt><dd>{healthRecord.activity_level || 'Not recorded'}</dd></div>
              <div>
                <dt>Allergies</dt>
                <dd>{healthRecord.allergies?.length ? healthRecord.allergies.join(', ') : 'None recorded'}</dd>
              </div>
              <div className="patient-notes">
                <dt>Notes</dt>
                <dd>{healthRecord.notes || 'None'}</dd>
              </div>
            </dl>
          )}
        </section>
      )}
    </main>
  );
}

export default PatientLookup;
