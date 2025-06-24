/**
 * Wallet state management using Zustand
 * 
 * This module provides a store for managing wallet state:
 * - Unlocking the wallet with a passphrase
 * - Locking the wallet (clearing sensitive data from memory)
 * - Tracking the wallet's locked/unlocked state
 */

import { create } from 'zustand';
import { decryptPrivateKey, secureErase } from './crypto';
import { getWallet } from './db';

/**
 * Wallet state interface
 */
export interface WalletState {
  // Current wallet state
  address?: string;
  unlocked: boolean;
  privateKey?: string;
  
  // Actions
  setLocked: () => void;
  unlock: (passphrase: string, address: string) => Promise<boolean>;
}

/**
 * Create the wallet store
 */
export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  unlocked: false,
  
  // Lock the wallet (clear sensitive data from memory)
  setLocked: () => {
    const { privateKey } = get();
    
    // Securely erase the private key if it exists
    if (privateKey) {
      const privateKeyBytes = new TextEncoder().encode(privateKey);
      secureErase(privateKeyBytes);
    }
    
    // Reset the state
    set({
      address: undefined,
      privateKey: undefined,
      unlocked: false,
    });
  },
  
  // Unlock the wallet with a passphrase
  unlock: async (passphrase: string, address: string): Promise<boolean> => {
    try {
      // Get the wallet data from IndexedDB
      const wallet = await getWallet(address);
      
      if (!wallet) {
        console.error('Wallet not found');
        return false;
      }
      
      // Combine salt, iv, and ciphertext into a single base64 string
      const encryptedBytes = new Uint8Array(wallet.salt.length + wallet.iv.length + wallet.ciphertext.length);
      encryptedBytes.set(wallet.salt, 0);
      encryptedBytes.set(wallet.iv, wallet.salt.length);
      encryptedBytes.set(wallet.ciphertext, wallet.salt.length + wallet.iv.length);
      
      // Convert to base64
      const encryptedBase64 = btoa(
        Array.from(encryptedBytes)
          .map(byte => String.fromCharCode(byte))
          .join('')
      );
      
      // Decrypt the private key
      const privateKey = await decryptPrivateKey(encryptedBase64, passphrase);
      
      // Update the state
      set({
        address,
        privateKey,
        unlocked: true,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
      return false;
    }
  },
}));

/**
 * Hook to check if the wallet is unlocked
 * @returns True if the wallet is unlocked, false otherwise
 */
export function useIsWalletUnlocked(): boolean {
  return useWalletStore(state => state.unlocked);
}

/**
 * Hook to get the current wallet address
 * @returns The current wallet address or undefined if not set
 */
export function useWalletAddress(): string | undefined {
  return useWalletStore(state => state.address);
}