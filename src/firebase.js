import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
let appCheck;

if (typeof window !== 'undefined' && !isTestEnv && RECAPTCHA_SITE_KEY) {
  // Ensure every auth/firestore request carries an App Check token (required once enforcement is on).
  const globalScope = window;
  if (process.env.REACT_APP_APPCHECK_DEBUG_TOKEN) {
    globalScope.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.REACT_APP_APPCHECK_DEBUG_TOKEN;
  }

  if (!globalScope.__APP_CHECK_INSTANCE) {
    globalScope.__APP_CHECK_INSTANCE = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
  appCheck = globalScope.__APP_CHECK_INSTANCE;
}

export { app, auth, db, appCheck, storage };
