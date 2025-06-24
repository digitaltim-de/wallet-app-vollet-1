/**
 * Account-specific IndexedDB functions for wallet management
 * 
 * This module provides functions for:
 * - Storing wallets in the account-specific database
 * - Retrieving wallets from the account-specific database
 * - Managing wallet data
 */

import { IDBPDatabase } from 'idb';
import { MySchema } from './dbFactory';

// Wallet type definition
export interface Wallet {
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
  createdAt?: number;
}

/**
 * Save a wallet in the account-specific database
 * 
 * @param db - The database connection
 * @param wallet - The wallet data to store
 * @returns A Promise that resolves when the wallet is stored
 */
export async function saveWallet(db: IDBPDatabase<MySchema>, wallet: Wallet): Promise<void> {
  const walletData = {
    ...wallet,
    createdAt: wallet.createdAt || Date.now()
  };

  await db.put('wallets', walletData);
}

/**
 * Get a wallet by its ID
 * 
 * @param db - The database connection
 * @param id - The wallet ID
 * @returns A Promise resolving to the wallet data or undefined if not found
 */
export async function getWallet(db: IDBPDatabase<MySchema>, id: string): Promise<Wallet | undefined> {
  return db.get('wallets', id);
}

/**
 * Get all wallets
 * 
 * @param db - The database connection
 * @returns A Promise resolving to an array of all wallets
 */
export async function getAllWallets(db: IDBPDatabase<MySchema>): Promise<Wallet[]> {
  return db.getAll('wallets');
}

/**
 * Get wallets by network
 * 
 * @param db - The database connection
 * @param network - The blockchain network
 * @returns A Promise resolving to an array of wallets for the specified network
 */
export async function getWalletsByNetwork(
  db: IDBPDatabase<MySchema>,
  network: 'ethereum' | 'bnb'
): Promise<Wallet[]> {
  return db.getAllFromIndex('wallets', 'by-network', network);
}

/**
 * Delete a wallet by its ID
 * 
 * @param db - The database connection
 * @param id - The wallet ID
 * @returns A Promise that resolves when the wallet is deleted
 */
export async function deleteWallet(db: IDBPDatabase<MySchema>, id: string): Promise<void> {
  await db.delete('wallets', id);
}

/**
 * Check if a wallet exists
 * 
 * @param db - The database connection
 * @param id - The wallet ID
 * @returns A Promise resolving to true if the wallet exists, false otherwise
 */
export async function walletExists(db: IDBPDatabase<MySchema>, id: string): Promise<boolean> {
  const wallet = await db.get('wallets', id);
  return wallet !== undefined;
}