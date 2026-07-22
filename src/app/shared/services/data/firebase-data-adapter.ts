import { initializeApp, getApp, getApps } from 'firebase/app';
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';
import { environment } from '../../../../../environments/environment';
import { LocalStorageDataAdapter, type DataAdapter } from './data.service';

const app = getApps().length ? getApp() : initializeApp(environment.firebaseConfig);
const firestore = getFirestore(app);
const records = collection(firestore, 'app-data');

export class FirebaseDataAdapter implements DataAdapter {
  private readonly local = new LocalStorageDataAdapter();

  async initialize(): Promise<void> {
    try {
      const snapshot = await getDocs(records);
      snapshot.forEach((record) => {
        const value = record.data()['value'];
        if (typeof value === 'string') this.local.write(record.id, value);
      });
    } catch {
      // Keep the local cache if Firebase is unavailable or the config is incomplete.
    }
  }

  read(key: string): string | null {
    return this.local.read(key);
  }

  write(key: string, value: string): void {
    this.local.write(key, value);
    void setDoc(doc(records, key), { value }).catch(() => {
      // Local storage remains the source of truth if the remote write fails.
    });
  }

  remove(key: string): void {
    this.local.remove(key);
    void deleteDoc(doc(records, key)).catch(() => {
      // Ignore remote delete errors; the local cache has already been updated.
    });
  }
}
