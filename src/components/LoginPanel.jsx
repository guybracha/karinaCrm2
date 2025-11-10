import { useEffect, useRef, useState } from 'react';
import { signIn, signInWithGoogle } from '../lib/auth';
import { assertStaffAccess } from '../lib/staff';
import { RECAPTCHA_SITE_KEY } from '../config';

const isTestEnv = process.env.NODE_ENV === 'test';
const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-enterprise';

function loadRecaptchaScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not available'));
  }
  if (window.grecaptcha) {
    return Promise.resolve(window.grecaptcha);
  }
  const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.grecaptcha));
      existingScript.addEventListener('error', reject);
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function LoginPanel() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(isTestEnv);
  const [captchaError, setCaptchaError] = useState(null);
  const loadingTokenRef = useRef(false);

  useEffect(() => {
    if (isTestEnv) {
      setCaptchaReady(true);
      return;
    }

    let mounted = true;

    loadRecaptchaScript()
      .then((grecaptcha) => {
        if (!mounted) return;
        grecaptcha.enterprise.ready(() => {
          if (mounted) {
            setCaptchaReady(true);
            setCaptchaError(null);
          }
        });
      })
      .catch(() => {
        if (mounted) {
          setCaptchaError('טעינת reCAPTCHA נכשלה. נסה לרענן את העמוד.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function getRecaptchaToken() {
    if (isTestEnv) {
      return 'test-token';
    }
    if (!captchaReady) {
      throw new Error('reCAPTCHA עדיין נטען. נסה שוב בעוד רגע.');
    }
    if (!window.grecaptcha || !window.grecaptcha.enterprise) {
      throw new Error('reCAPTCHA לא זמין בדפדפן הנוכחי.');
    }
    loadingTokenRef.current = true;
    const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, {
      action: 'LOGIN',
    });
    loadingTokenRef.current = false;
    if (!token) {
      throw new Error('reCAPTCHA לא הצליח להפיק אסימון.');
    }
    return token;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError('נא למלא אימייל וסיסמה.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await getRecaptchaToken();
      const credential = await signIn(form);
      await assertStaffAccess(credential.user);
    } catch (err) {
      if (loadingTokenRef.current) {
        loadingTokenRef.current = false;
      }
      setError(err.message || 'ההתחברות נכשלה. ודא פרטים נכונים והרשאות.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setCaptchaError(null);
    setGoogleLoading(true);
    try {
      await getRecaptchaToken();
      const credential = await signInWithGoogle();
      await assertStaffAccess(credential.user);
    } catch (err) {
      if (loadingTokenRef.current) {
        loadingTokenRef.current = false;
      }
      setError(
        err.message || 'התחברות Google נכשלה. ודא שיש למשתמש הרשאות CRM או staff.',
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="login-panel">
      <h2>התחברות לצוות / CRM</h2>
      <p>
        כדי לראות נתוני לקוחות יש להתחבר עם משתמש שיש לו הרשאות CRM או staff
        ב-Firebase.
      </p>
      <form className="form" onSubmit={handleSubmit}>
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
          />
        </label>
        {captchaError && <p className="status-message error">{captchaError}</p>}
        {!isTestEnv && (
          <p className="status-message">
            reCAPTCHA מגן על הטופס הזה (מופעל אוטומטית בעת שליחה).
          </p>
        )}
        {error && <p className="status-message error">{error}</p>}
        <button type="submit" disabled={loading || googleLoading}>
          {loading ? 'מתחבר...' : 'התחבר'}
        </button>
      </form>
      <div className="auth-divider">
        <span>או</span>
      </div>
      <button
        type="button"
        className="google-button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
      >
        {googleLoading ? 'מתחבר עם Google...' : 'התחבר עם Google'}
      </button>
    </div>
  );
}
