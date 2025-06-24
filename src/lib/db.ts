/**
 * IndexedDB wrapper for storing wallet data
 * 
 * This module provides functions for:
 * - Storing encrypted wallet keys
 * - Retrieving wallet information
 * - Managing wallet data
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface WalletDB extends DBSchema {
  wallets: {
    key: string; // address as the key
    value: {
      address: string;
      encryptedKey: string;
      network: 'ethereum' | 'bnb';
      createdAt: number;
    };
    indexes: {
      'by-network': string;
      'by-created': number;
    };
  };
}

// Database name and version
const DB_NAME = 'wollet-db';
const DB_VERSION = 1;

// Database connection
let dbPromise: Promise<IDBPDatabase<WalletDB>> | null = null;

/**
 * Initialize the database connection
 */
export function initDB(): Promise<IDBPDatabase<WalletDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WalletDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create the wallets store
        const walletStore = db.createObjectStore('wallets', {
          keyPath: 'address'
        });
        
        // Create indexes
        walletStore.createIndex('by-network', 'network');
        walletStore.createIndex('by-created', 'createdAt');
      }
    });
  }
  
  return dbPromise;
}

/**
 * Store a wallet in the database
 * 
 * @param wallet - The wallet data to store
 * @returns A Promise that resolves when the wallet is stored
 */
export async function storeWallet(wallet: {
  address: string;
  encryptedKey: string;
  network: 'ethereum' | 'bnb';
}): Promise<void> {
  const db = await initDB();
  const walletData = {
    ...wallet,
    createdAt: Date.now()
  };
  
  await db.put('wallets', walletData);
}

/**
 * Get a wallet by its address
 * 
 * @param address - The wallet address
 * @returns A Promise resolving to the wallet data or undefined if not found
 */
export async function getWallet(address: string): Promise<{
  address: string;
  encryptedKey: string;
  network: 'ethereum' | 'bnb';
  createdAt: number;
} | undefined> {
  const db = await initDB();
  return db.get('wallets', address);
}

/**
 * Get all wallets
 * 
 * @returns A Promise resolving to an array of all wallets
 */
export async function getAllWallets(): Promise<{
  address: string;
  encryptedKey: string;
  network: 'ethereum' | 'bnb';
  createdAt: number;
}[]> {
  const db = await initDB();
  return db.getAll('wallets');
}

/**
 * Get wallets by network
 * 
 * @param network - The blockchain network
 * @returns A Promise resolving to an array of wallets for the specified network
 */
export async function getWalletsByNetwork(network: 'ethereum' | 'bnb'): Promise<{
  address: string;
  encryptedKey: string;
  network: 'ethereum' | 'bnb';
  createdAt: number;
}[]> {
  const db = await initDB();
  return db.getAllFromIndex('wallets', 'by-network', network);
}

/**
 * Delete a wallet by its address
 * 
 * @param address - The wallet address
 * @returns A Promise that resolves when the wallet is deleted
 */
export async function deleteWallet(address: string): Promise<void> {
  const db = await initDB();
  await db.delete('wallets', address);
}

/**
 * Check if a wallet exists
 * 
 * @param address - The wallet address
 * @returns A Promise resolving to true if the wallet exists, false otherwise
 */
export async function walletExists(address: string): Promise<boolean> {
  const db = await initDB();
  const wallet = await db.get('wallets', address);
  return wallet !== undefined;
}