import { useEffect, useRef, useState } from 'react'
import './Popup.css'

function Popup({ onSubmit }) {
  const dialogRef = useRef(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (show && !dialog.open) {
      dialog.showModal()
    } else if (!show && dialog.open) {
      dialog.close()
    }
  }, [show])

  const handleClose = () => {
    setShow(false)
    setError('')
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await onSubmit(formData)
      handleClose()
    } catch {
        setError('Unable to submit. Please try again.')

    }
  }

  return (
    <>
      <button
        className="popup-trigger"
        type="button"
        onClick={() => setShow(true)}
      >
        Log in
      </button>

      <dialog
        className="auth-dialog"
        ref={dialogRef}
        aria-labelledby="auth-dialog-title"
        onClose={handleClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) handleClose()
        }}
      >
        <div className="auth-dialog-header">
          <h2 id="auth-dialog-title">Log in</h2>
          <button
            className="auth-dialog-close"
            type="button"
            aria-label="Close dialog"
            onClick={handleClose}
          >
            &times;
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              name="username"
              onChange={handleInputChange}
              required
              value={formData.username}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              onChange={handleInputChange}
              required
              type="password"
              value={formData.password}
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <div className="auth-dialog-actions">
            <button
              className="auth-cancel"
              type="button"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className="popup-trigger"
              type="submit"
            >
              Log in
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}

export default Popup
