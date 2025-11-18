import { useEffect, useRef, useState } from 'react';
import { signIn, signUp } from '../lib/auth';
import { assertStaffAccess } from '../lib/staff';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const isTestEnv = process.env.NODE_ENV === 'test';

export default function LoginPanel() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadingTokenRef = useRef(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError('נא למלא אימייל וסיסמה.');
      return;
    }
    
    if (mode === 'signup' && !form.displayName) {
      setError('נא למלא שם מלא.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (mode === 'login') {
        const credential = await signIn(form);
        await assertStaffAccess(credential.user);
      } else {
        // הרשמה
        const credential = await signUp(form);
        
        // שמירת פרטי המשתמש ב-Firestore עם active: false
        await setDoc(doc(db, 'staff', credential.user.uid), {
          email: form.email,
          displayName: form.displayName,
          role: 'pending',
          active: false,
          updatedAt: new Date()
        });
        
        setSuccess('ההרשמה הושלמה! המתן לאישור מנהל המערכת.');
        setForm({ email: '', password: '', displayName: '' });
        
        // יציאה מהמערכת אחרי הרשמה
        await credential.user.getIdToken();
      }
    } catch (err) {
      if (loadingTokenRef.current) {
        loadingTokenRef.current = false;
      }
      
      let errorMessage = 'הפעולה נכשלה. נסה שוב.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'האימייל כבר קיים במערכת. נסה להתחבר.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'הסיסמה חלשה מדי. השתמש בסיסמה בת 6 תווים לפחות.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'כתובת האימייל לא תקינה.';
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
      <h2>{mode === 'login' ? 'התחברות לצוות / CRM' : 'הרשמה למערכת'}</h2>
      <p>
        {mode === 'login' 
          ? 'כדי לראות נתוני לקוחות יש להתחבר עם משתמש שיש לו הרשאות CRM או staff ב-Firebase.'
          : 'לאחר ההרשמה, המתן לאישור מנהל המערכת כדי לקבל גישה למערכת.'}
      </p>
      <form className="form" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <label>
            שם מלא
            <input
              name="displayName"
              type="text"
              value={form.displayName}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </label>
        )}
        <label>
          אימייל עבודה
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
        {success && <p className="status-message success">{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? (mode === 'login' ? 'מתחבר...' : 'נרשם...') : (mode === 'login' ? 'התחבר' : 'הרשם')}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {mode === 'login' ? (
          <>
            אין לך חשבון?{' '}
            <button 
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccess(null);
                setForm({ email: '', password: '', displayName: '' });
              }}
              style={{ background: 'none', border: 'none', color: '#ff4c84', cursor: 'pointer', textDecoration: 'underline' }}
            >
              הירשם כאן
            </button>
          </>
        ) : (
          <>
            כבר יש לך חשבון?{' '}
            <button 
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
                setForm({ email: '', password: '', displayName: '' });
              }}
              style={{ background: 'none', border: 'none', color: '#ff4c84', cursor: 'pointer', textDecoration: 'underline' }}
            >
              התחבר כאן
            </button>
          </>
        )}
      </p>
    </div>
  );
}
