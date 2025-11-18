import { useState } from 'react';
import { signIn } from '../lib/auth';
import { assertStaffAccess } from '../lib/staff';

export default function LoginPanel() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError('נא להזין אימייל וסיסמה.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const credential = await signIn(form);
      await assertStaffAccess(credential.user);
    } catch (err) {
      let errorMessage = 'אירעה שגיאה בהתחברות. נסה שוב.';
      if (err.code === 'auth/invalid-email') {
        errorMessage = 'כתובת האימייל אינה תקינה.';
      } else if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        errorMessage = 'המשתמש לא נמצא או שהסיסמה שגויה.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-panel">
      <h2>התחברות למערכת Karina CRM</h2>
      <p>הזן את פרטי ההתחברות שקיבלת כדי להתחבר למערכת העובדים של Karina.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          אימייל
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </label>
        <label>
          סיסמה
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            required
            minLength={6}
          />
        </label>
        {error && <p className="status-message error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'מתחבר...' : 'התחברות'}
        </button>
      </form>
    </div>
  );
}
