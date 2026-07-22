import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseApp } from '../firebase/firebase-app';
import { getAuth } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = getAuth(getFirebaseApp());
  private readonly router = inject(Router);
  private readonly userState = signal<User | null>(null);
  private readonly readyState = signal(false);
  private readyResolver: (() => void) | null = null;
  private readonly readyPromise = new Promise<void>((resolve) => {
    this.readyResolver = resolve;
  });
  private readonly googleProvider = new GoogleAuthProvider();

  readonly user = computed(() => this.userState());
  readonly ready = computed(() => this.readyState());
  readonly isAuthenticated = computed(() => !!this.userState());
  readonly displayName = computed(
    () => this.userState()?.displayName ?? this.userState()?.email ?? 'Guest',
  );

  constructor() {
    this.googleProvider.setCustomParameters({ prompt: 'select_account' });
    onAuthStateChanged(this.auth, (user) => {
      this.userState.set(user);
      if (this.readyState()) return;
      this.readyState.set(true);
      this.readyResolver?.();
      this.readyResolver = null;
    });
  }

  initialize(): Promise<void> {
    return this.readyPromise;
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async registerWithEmail(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<void> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const cleanDisplayName = displayName?.trim();
    if (cleanDisplayName) {
      await updateProfile(credential.user, { displayName: cleanDisplayName });
    }
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, this.googleProvider);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
    await this.router.navigateByUrl('/login');
  }
}
