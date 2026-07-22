export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
  firebaseConfig: {
    apiKey: 'AIzaSyBMneOg3pOUzvhUTapPp6ajYX0OJWhhN7k',
    authDomain: 'make-the-most-3bcb5.firebaseapp.com',
    projectId: 'make-the-most-3bcb5',
    storageBucket: 'make-the-most-3bcb5.firebasestorage.app',
    messagingSenderId: '897090994735',
    appId: '1:897090994735:web:b2a62fcfc95e591c88fcda',
  },
  firestore: {
    useEmulator: true,
    host: '127.0.0.1',
    port: 8080,
  },
} as const;
