/**
 * IndexedDB factory for account databases
 * 
 * This module provides functions for:
 * - Opening or creating account-specific IndexedDB databases
 * - Defining the database schema
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Database schema definition
 */
export interface MySchema extends DBSchema {
  meta: { key: 'id'; value: { id: 'singleton'; createdAt: number } };
}

/**
 * Opens or creates an account database with the specified name
 * 
 * @param name - The database name (derived from passphrase)
 * @returns A Promise resolving to the database connection
 */
export async function openAccountDB(name: string): Promise<IDBPDatabase<MySchema>> {
  return openDB<MySchema>(name, 1, {
    upgrade(db) {
      // v1 – just a meta store, data stores can be added later
      db.createObjectStore('meta', { keyPath: 'id' });
    }
  });
}