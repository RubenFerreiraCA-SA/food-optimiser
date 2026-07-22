import { getApp, getApps, initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(environment.firebaseConfig);
}
