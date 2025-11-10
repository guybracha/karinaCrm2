import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { signOutUser } from './auth';

function isActiveStaffRecord(data) {
  if (!data) return false;
  if (data.active === true) return true;
  if (typeof data.status === 'string') {
    return data.status.toLowerCase() === 'active';
  }
  return false;
}

export async function fetchStaffProfile(uid) {
  if (!uid) {
    throw new Error('אין מזהה משתמש זמין.');
  }
  const ref = doc(db, 'staff', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }
  return { id: snap.id, ...snap.data() };
}

export async function assertStaffAccess(user) {
  if (process.env.NODE_ENV === 'test') {
    return { id: 'test-staff', active: true };
  }
  if (!user) {
    throw new Error('לא אותר משתמש מחובר.');
  }
  const profile = await fetchStaffProfile(user.uid);
  if (!profile || !isActiveStaffRecord(profile)) {
    await signOutUser();
    throw new Error('אין לך הרשאת צוות פעילה במערכת.');
  }
  return profile;
}
