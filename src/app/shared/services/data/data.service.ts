import { Injectable, InjectionToken, inject } from '@angular/core';

/** Replace this adapter at bootstrap to persist to a host-backed store later. */
export interface DataAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

export class LocalStorageDataAdapter implements DataAdapter {
  read(key: string): string | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  write(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {
      // Persistence is optional: the in-memory domain state remains usable.
    }
  }

  remove(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {
      // See write(): browsers may reject storage access.
    }
  }
}

export const DATA_ADAPTER = new InjectionToken<DataAdapter>('DATA_ADAPTER', {
  providedIn: 'root',
  factory: () => new LocalStorageDataAdapter(),
});

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly adapter = inject(DATA_ADAPTER);

  read<T>(key: string, fallback: T): T {
    const value = this.adapter.read(key);
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  has(key: string): boolean {
    return this.adapter.read(key) !== null;
  }

  write<T>(key: string, value: T): void {
    this.adapter.write(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.adapter.remove(key);
  }
}
