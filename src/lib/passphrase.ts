/**
 * Passphrase utilities for database name derivation
 * 
 * This module provides functions for:
 * - Deriving a unique database name from a passphrase using SHA-256
 */

/**
 * Derives a unique database name from a passphrase using SHA-256
 * 
 * @param pass - The user's passphrase
 * @returns A Promise resolving to a URL-safe database name
 */
export async function deriveDbName(pass: string): Promise<string> {
  const enc = new TextEncoder().encode(pass);
  const key = await crypto.subtle.digest('SHA-256', enc);          // 32 bytes
  const b64 = btoa(String.fromCharCode(...new Uint8Array(key)))    // +,/ chars
            .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  // e.g. aMH_1Jb3…  — valid as IndexedDB name
  return `bp_${b64}`;                                              // prefix
}