import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { RECAPTCHA_SITE_KEY } from './config';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = (() => {
  try {
    return typeof window === 'undefined' ? null : getStorage(app);
  } catch (error) {
    console.warn('Unable to initialize Firebase Storage', error);
    return null;
  }
})();
const isTestEnv = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
let appCheck;

// App Check - רק ב-localhost עם debug token
if (typeof window !== 'undefined' && !isTestEnv && isLocalhost) {
  // הפעלת debug mode ב-localhost בלבד
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  
  try {
    if (!window.__APP_CHECK_INSTANCE && RECAPTCHA_SITE_KEY) {
      window.__APP_CHECK_INSTANCE = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      appCheck = window.__APP_CHECK_INSTANCE;
    }
  } catch (error) {
    console.warn('App Check initialization failed:', error);
  }
}

export { app, auth, db, appCheck, storage };
