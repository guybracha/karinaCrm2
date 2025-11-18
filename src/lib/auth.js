import {
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export function signIn({ email, password }) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUp({ email, password, displayName }) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInAsGuest() {
  return signInAnonymously(auth);
}

export function signOutUser() {
  return signOut(auth);
}
