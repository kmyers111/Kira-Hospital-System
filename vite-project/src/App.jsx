import './App.css'
import Popup from './Components/Popup.jsx';
import PatientLookup from './Components/PatientLookup.jsx';
import PatientProfile from './Components/PatientProfile.jsx';
import { useAuth } from './AuthContext.jsx';
import { Navigate, Route, Routes } from 'react-router-dom';

function App() {
  const { user, loading, authError, login } = useAuth();

  if (!loading && user && ['admin', 'staff', 'patient'].includes(user.role)) {
    return (
      <Routes>
        <Route path="/" element={<PatientLookup />} />
        <Route
          path="/patients/:patientId"
          element={['admin', 'staff'].includes(user.role)
            ? <PatientProfile />
            : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!loading && user) {
    return <main className="login-page"><p role="alert">This account does not have access to the patient portal.</p></main>;
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="hospital-title">
        <h1 id="hospital-title">Kira Hospital System</h1>
        <div className="title-underline" aria-hidden="true" />
        {authError && <p role="alert">{authError}</p>}
        {loading ? <p role="status">Checking your session...</p> : <Popup onSubmit={login} />}
      </section>
    </main>
  )
}

export default App