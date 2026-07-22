import { effect, Injectable, inject, signal } from '@angular/core';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { getFirebaseApp } from '../firebase/firebase-app';

const firestore = getFirestore(getFirebaseApp());

if (environment.firestore.useEmulator) {
  connectFirestoreEmulator(firestore, environment.firestore.host, environment.firestore.port);
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly auth = inject(AuthService);
  private readonly state = signal<Record<string, string>>({});
  private loadVersion = 0;
  private currentLoad: Promise<void> = Promise.resolve();
  private initialization: Promise<void> | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.currentLoad = this.loadForUser(user?.uid ?? null);
    });
  }

  initialize(): Promise<void> {
    this.initialization ??= this.auth.initialize().then(async () => {
      this.currentLoad = this.loadForUser(this.auth.user()?.uid ?? null);
      await this.currentLoad;
    });

    return this.initialization;
  }

  whenReady(): Promise<void> {
    return this.currentLoad;
  }

  read<T>(key: string, fallback: T): T {
    const value = this.state()[key];
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  has(key: string): boolean {
    return this.state()[key] !== undefined;
  }

  write<T>(key: string, value: T): void {
    const serialized = JSON.stringify(value);
    this.state.update((current) => ({ ...current, [key]: serialized }));
    const uid = this.auth.user()?.uid;
    if (!uid) return;

    void setDoc(doc(firestore, 'users', uid, 'app-data', key), { value: serialized }).catch(
      (error) => {
        console.error('Failed to write Firestore data:', { uid, key, error });
      },
    );
  }

  remove(key: string): void {
    this.state.update((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });

    const uid = this.auth.user()?.uid;
    if (!uid) return;

    void deleteDoc(doc(firestore, 'users', uid, 'app-data', key)).catch((error) => {
      console.error('Failed to delete Firestore data:', { uid, key, error });
    });
  }

  private async loadForUser(uid: string | null): Promise<void> {
    const version = ++this.loadVersion;

    if (!uid) {
      this.state.set({});
      return;
    }

    try {
      const snapshot = await getDocs(collection(firestore, 'users', uid, 'app-data'));
      if (version !== this.loadVersion) return;

      const next: Record<string, string> = {};
      snapshot.forEach((record) => {
        const value = record.data()['value'];
        if (typeof value === 'string') next[record.id] = value;
      });
      this.state.set(next);
    } catch (error) {
      console.error('Failed to load Firestore data:', { uid, error });
      if (version === this.loadVersion) {
        this.state.set({});
      }
    }
  }
}
