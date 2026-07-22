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
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { getFirebaseApp } from '../firebase/firebase-app';

type FirestoreDocumentData = Record<string, unknown>;
type FirestoreCollectionData = Record<string, FirestoreDocumentData>;
type CollectionScope = 'user' | 'global';
type CollectionKey = `${CollectionScope}:${string}`;

const firestore = getFirestore(getFirebaseApp());

if (environment.firestore.useEmulator) {
  connectFirestoreEmulator(firestore, environment.firestore.host, environment.firestore.port);
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly auth = inject(AuthService);
  private readonly collections = signal<Partial<Record<CollectionKey, FirestoreCollectionData>>>({});
  private loadVersion = 0;
  private currentLoad: Promise<void> = Promise.resolve();
  private initialization: Promise<void> | null = null;

  readonly revision = signal(0);

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

  readCollection<T extends { id: string }>(
    collectionName: string,
    fallback: T[],
    scope: CollectionScope = 'user',
  ): T[] {
    const collection = this.collections()[this.collectionKey(collectionName, scope)];
    if (collection === undefined) return fallback;

    return Object.entries(collection).map(([id, data]) => ({
      id,
      ...(data as Record<string, unknown>),
    })) as T[];
  }

  readDocument<T extends object>(
    collectionName: string,
    docId: string,
    fallback: T,
    scope: CollectionScope = 'user',
  ): T {
    const collection = this.collections()[this.collectionKey(collectionName, scope)];
    if (collection === undefined) return fallback;

    return (collection[docId] as T | undefined) ?? fallback;
  }

  hasCollection(collectionName: string, scope: CollectionScope = 'user'): boolean {
    return this.collections()[this.collectionKey(collectionName, scope)] !== undefined;
  }

  hasDocument(collectionName: string, docId: string, scope: CollectionScope = 'user'): boolean {
    return this.collections()[this.collectionKey(collectionName, scope)]?.[docId] !== undefined;
  }

  collectionSize(collectionName: string, scope: CollectionScope = 'user'): number {
    return Object.keys(this.collections()[this.collectionKey(collectionName, scope)] ?? {}).length;
  }

  createDocument<T extends object>(
    collectionName: string,
    value: T,
    scope: CollectionScope = 'user',
  ): string {
    const id = this.createAutoId(
      new Set(Object.keys(this.collections()[this.collectionKey(collectionName, scope)] ?? {})),
    );
    this.upsertCollectionDocument(collectionName, id, value, scope);
    return id;
  }

  replaceCollection<T extends object>(
    collectionName: string,
    items: T[],
    scope: CollectionScope = 'user',
  ): Array<T & { id: string }> {
    const existingIds = new Set(Object.keys(this.collections()[this.collectionKey(collectionName, scope)] ?? {}));
    const nextItems = items.map((item) => {
      const id = this.createAutoId(existingIds);
      existingIds.add(id);
      return { ...item, id } as T & { id: string };
    });
    const next = this.toCollectionData(nextItems);
    this.collections.update((current) => ({
      ...current,
      [this.collectionKey(collectionName, scope)]: next,
    }));
    this.bumpRevision();

    const uid = this.auth.user()?.uid;
    if (!uid && scope === 'global') return nextItems;
    if (!uid) return nextItems;

    void this.syncCollection(uid, collectionName, nextItems, next, scope).catch((error) => {
      console.error('Failed to replace Firestore collection:', { uid, collectionName, scope, error });
    });

    return nextItems;
  }

  upsertDocument<T extends object>(
    collectionName: string,
    docId: string,
    value: T,
    scope: CollectionScope = 'user',
  ): void {
    this.upsertCollectionDocument(collectionName, docId, value, scope);
  }

  deleteDocument(collectionName: string, docId: string, scope: CollectionScope = 'user'): void {
    this.collections.update((current) => {
      const existing = current[this.collectionKey(collectionName, scope)];
      if (!existing || existing[docId] === undefined) return current;

      const next = { ...existing };
      delete next[docId];
      return { ...current, [this.collectionKey(collectionName, scope)]: next };
    });
    this.bumpRevision();

    const uid = this.auth.user()?.uid;
    if (!uid) return;

    const ref = this.documentRef(uid, collectionName, docId, scope);
    void deleteDoc(ref).catch((error) => {
      console.error('Failed to delete Firestore document:', { uid, collectionName, docId, scope, error });
    });
  }

  private upsertCollectionDocument<T extends object>(
    collectionName: string,
    docId: string,
    value: T,
    scope: CollectionScope,
  ): void {
    this.collections.update((current) => {
      const key = this.collectionKey(collectionName, scope);
      const existing = current[key] ?? {};
      return {
        ...current,
        [key]: { ...existing, [docId]: this.stripId(value) },
      };
    });
    this.bumpRevision();

    const uid = this.auth.user()?.uid;
    if (!uid) return;

    void setDoc(this.documentRef(uid, collectionName, docId, scope), this.stripId(value)).catch(
      (error) => {
        console.error('Failed to write Firestore document:', {
          uid,
          collectionName,
          docId,
          scope,
          error,
        });
      },
    );
  }

  private async loadForUser(uid: string | null): Promise<void> {
    const version = ++this.loadVersion;

    try {
      if (!uid) {
        if (version !== this.loadVersion) return;
        this.collections.set({});
        this.bumpRevision();
        return;
      }

      const entries = await Promise.all(
        ['profile', 'data', 'recipes'].map(async (collectionName) => {
          const snapshot = await getDocs(collection(firestore, 'users', uid, collectionName));
          const next: FirestoreCollectionData = {};
          snapshot.forEach((record) => {
            next[record.id] = record.data();
          });
          return [this.collectionKey(collectionName, 'user'), next] as const;
        }),
      );

      const globalEntries = await Promise.all(
        ['recipes', 'ingredients'].map(async (collectionName) => {
          const snapshot = await getDocs(collection(firestore, collectionName));
          const next: FirestoreCollectionData = {};
          snapshot.forEach((record) => {
            next[record.id] = record.data();
          });
          return [this.collectionKey(collectionName, 'global'), next] as const;
        }),
      );

      if (version !== this.loadVersion) return;

      this.collections.set(
        Object.fromEntries([...entries, ...globalEntries]) as Partial<
          Record<CollectionKey, FirestoreCollectionData>
        >,
      );
      this.bumpRevision();
    } catch (error) {
      console.error('Failed to load Firestore data:', { uid, error });
      if (version === this.loadVersion) {
        this.collections.set({});
        this.bumpRevision();
      }
    }
  }

  private async syncCollection<T extends { id: string }>(
    uid: string,
    collectionName: string,
    items: T[],
    current: FirestoreCollectionData,
    scope: CollectionScope,
  ): Promise<void> {
    const collectionRef = this.collectionRef(uid, collectionName, scope);
    const nextIds = new Set(items.map((item) => item.id));

    await Promise.all([
      ...items.map((item) =>
        setDoc(doc(collectionRef, item.id), this.stripId(item)).catch((error) => {
          console.error('Failed to write Firestore document:', {
            uid,
            collectionName,
            docId: item.id,
            error,
          });
        }),
      ),
      ...Object.keys(current)
        .filter((docId) => !nextIds.has(docId))
        .map((docId) =>
          deleteDoc(doc(collectionRef, docId)).catch((error) => {
            console.error('Failed to delete Firestore document:', {
              uid,
              collectionName,
              docId,
              error,
            });
          }),
      ),
    ]);
  }

  private toCollectionData<T extends { id: string }>(items: T[]): FirestoreCollectionData {
    return Object.fromEntries(items.map((item) => [item.id, this.stripId(item)]));
  }

  private collectionKey(collectionName: string, scope: CollectionScope): CollectionKey {
    return `${scope}:${collectionName}`;
  }

  private collectionRef(uid: string, collectionName: string, scope: CollectionScope) {
    return scope === 'global'
      ? collection(firestore, collectionName)
      : collection(firestore, 'users', uid, collectionName);
  }

  private documentRef(uid: string, collectionName: string, docId: string, scope: CollectionScope) {
    return doc(this.collectionRef(uid, collectionName, scope), docId);
  }

  private createAutoId(existingIds: Set<string>): string {
    let id = '';
    do {
      const bytes = new Uint8Array(4);
      globalThis.crypto.getRandomValues(bytes);
      id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    } while (existingIds.has(id));
    return id;
  }

  private stripId<T extends object>(value: T): FirestoreDocumentData {
    const { id: _ignored, ...rest } = value as T & { id?: unknown };
    return rest as FirestoreDocumentData;
  }

  private bumpRevision(): void {
    this.revision.update((value) => value + 1);
  }
}
