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
  wallets: {
    key: string; // wallet id as the key
    value: {
      id: string;
      name: string;
      address: string;
      network: 'ethereum' | 'bnb';
      balance: number;
      balanceUSD: number;
      change24h: number;
      changePercent24h: number;
      tokens: Array<{
        symbol: string;
        name: string;
        balance: number;
        balanceUSD: number;
        price: number;
        change24h: number;
      }>;
      transactions: Array<{
        id: string;
        type: 'send' | 'receive';
        amount: number;
        symbol: string;
        to?: string;
        from?: string;
        timestamp: number;
        status: 'pending' | 'confirmed' | 'failed';
        hash: string;
      }>;
      createdAt: number;
    };
    indexes: {
      'by-network': string;
      'by-created': number;
    };
  };
}

/**
 * Opens or creates an account database with the specified name
 * 
 * @param name - The database name (derived from passphrase)
 * @returns A Promise resolving to the database connection
 */
export async function openAccountDB(name: string): Promise<IDBPDatabase<MySchema>> {
  return openDB<MySchema>(name, 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create stores based on version
      if (oldVersion < 1) {
        // Create meta store (for version 1)
        db.createObjectStore('meta', { keyPath: 'id' });
      }

      if (oldVersion < 2) {
        // Create wallets store (for version 2)
        const walletStore = db.createObjectStore('wallets', {
          keyPath: 'id'
        });

        // Create indexes
        walletStore.createIndex('by-network', 'network');
        walletStore.createIndex('by-created', 'createdAt');
      }
    }
  });
}
