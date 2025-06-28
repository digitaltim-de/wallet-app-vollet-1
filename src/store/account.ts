/**
 * Account store for managing user authentication state
 * 
 * This module provides a Zustand store for:
 * - Managing account unlock state
 * - Handling login and account creation
 * - Managing database connections
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IDBPDatabase } from 'idb';
import { deriveDbName } from '@/lib/passphrase';
import { openAccountDB, MySchema } from '@/lib/dbFactory';

// Interface for the account store state
interface AccountState {
  // State
  unlocked: boolean;
  db?: IDBPDatabase<MySchema>;
  dbName?: string;

  // Actions
  lock: () => void;
  login: (pass: string) => Promise<'ok' | 'not-found' | 'wrong-pass'>;
  createAccount: (pass: string) => Promise<'created' | 'exists'>;
  reconnect: () => Promise<boolean>;
}

// Create the account store
export const useAccountStore = create(
  persist<AccountState>(
    (set, get) => ({
      // Initial state
      unlocked: false,
      db: undefined,
      dbName: undefined,

      // Lock the account (clear state)
      lock: () => {
        const { db } = get();
        if (db) {
          db.close();
        }
        set({ unlocked: false, db: undefined, dbName: undefined });
      },

      // Reconnect to the database using the persisted dbName
      reconnect: async () => {
        const { dbName, unlocked } = get();

        // If not unlocked or no dbName, can't reconnect
        if (!unlocked || !dbName) {
          return false;
        }

        try {
          // Try to open the database with the persisted dbName
          const db = await openAccountDB(dbName);

          // Verify we can access the meta store
          const meta = await db.get('meta', 'id');
          if (!meta) {
            db.close();
            set({ unlocked: false, db: undefined });
            return false;
          }

          // Update the db in the state
          set({ db });
          return true;
        } catch (error) {
          console.error('Error reconnecting to database:', error);
          set({ unlocked: false, db: undefined });
          return false;
        }
      },

      // Login with passphrase
      login: async (pass: string) => {
        try {
          // Derive database name from passphrase
          const dbName = await deriveDbName(pass);

          // Check if database exists
          const dbList = await indexedDB.databases();
          const dbExists = dbList.some(db => db.name === dbName);

          if (!dbExists) {
            return 'not-found';
          }

          // Try to open the database
          try {
            const db = await openAccountDB(dbName);

            // Verify we can access the meta store
            const meta = await db.get('meta', 'id');
            if (!meta) {
              db.close();
              return 'wrong-pass';
            }

            // Set the state to unlocked with the database connection and dbName
            set({ unlocked: true, db, dbName });
            return 'ok';
          } catch (error) {
            console.error('Error opening database:', error);
            return 'wrong-pass';
          }
        } catch (error) {
          console.error('Login error:', error);
          return 'wrong-pass';
        }
      },

      // Create a new account
      createAccount: async (pass: string) => {
        try {
          // Derive database name from passphrase
          const dbName = await deriveDbName(pass);

          // Check if database already exists
          const dbList = await indexedDB.databases();
          const dbExists = dbList.some(db => db.name === dbName);

          if (dbExists) {
            return 'exists';
          }

          // Create and open the database
          const db = await openAccountDB(dbName);

          // Initialize the meta store with creation timestamp
          await db.put('meta', { id: 'singleton', createdAt: Date.now() });

          // Request persistent storage
          if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            console.log(`Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
          }

          // Set the state to unlocked with the database connection and dbName
          set({ unlocked: true, db, dbName });

          return 'created';
        } catch (error) {
          console.error('Create account error:', error);
          return 'exists'; // Default to exists on error to prevent data loss
        }
      }
    }),
    {
      name: 'account-storage', // unique name for the storage
      storage: createJSONStorage(() => sessionStorage), // use sessionStorage
    }
  )
);
