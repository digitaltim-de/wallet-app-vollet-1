/**
 * Crypto utilities for secure key management
 * 
 * This module provides functions for:
 * - Deriving encryption keys from passphrases
 * - Encrypting private keys with AES-GCM
 * - Decrypting private keys
 * - Securely erasing sensitive data from memory
 */

// Constants
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const AES_KEY_LENGTH = 256;

/**
 * Derives a CryptoKey from a passphrase using PBKDF2-SHA256
 * 
 * @param passphrase - The user's passphrase
 * @param salt - The salt to use for key derivation
 * @returns A Promise resolving to a CryptoKey
 */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  // Convert passphrase to an ArrayBuffer
  const encoder = new TextEncoder();
  const passphraseBuffer = encoder.encode(passphrase);

  // Import the passphrase as a key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passphraseBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive the key using PBKDF2
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypts a private key using AES-GCM
 * 
 * @param privateKeyHex - The private key in hexadecimal format
 * @param passphrase - The passphrase to use for encryption
 * @returns A Promise resolving to the encrypted key in base64 format (salt+iv+ciphertext)
 */
export async function encryptPrivateKey(privateKeyHex: string, passphrase: string): Promise<string> {
  // Convert hex private key to ArrayBuffer
  const privateKeyBytes = hexToBytes(privateKeyHex);

  // Generate a random salt
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Derive a key from the passphrase and salt
  const cryptoKey = await deriveKey(passphrase, salt);

  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the private key
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: AUTH_TAG_LENGTH * 8
    },
    cryptoKey,
    privateKeyBytes
  );

  // Combine the salt, IV, and encrypted data
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const result = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedArray.length);

  result.set(salt, 0);
  result.set(iv, SALT_LENGTH);
  result.set(encryptedArray, SALT_LENGTH + IV_LENGTH);

  // Convert to base64
  return bytesToBase64(result);
}

/**
 * Decrypts an encrypted private key
 * 
 * @param encryptedBase64 - The encrypted private key in base64 format (salt+iv+ciphertext)
 * @param passphrase - The passphrase to use for decryption
 * @returns A Promise resolving to the decrypted private key in hexadecimal format
 */
export async function decryptPrivateKey(encryptedBase64: string, passphrase: string): Promise<string> {
  // Convert base64 to ArrayBuffer
  const encryptedBytes = base64ToBytes(encryptedBase64);

  // Extract the salt, IV, and encrypted data
  const salt = encryptedBytes.slice(0, SALT_LENGTH);
  const iv = encryptedBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encryptedData = encryptedBytes.slice(SALT_LENGTH + IV_LENGTH);

  // Derive a key from the passphrase and salt
  const cryptoKey = await deriveKey(passphrase, salt);

  // Decrypt the private key
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: AUTH_TAG_LENGTH * 8
    },
    cryptoKey,
    encryptedData
  );

  // Convert to hex
  const decryptedBytes = new Uint8Array(decryptedBuffer);
  const privateKeyHex = bytesToHex(decryptedBytes);

  return privateKeyHex;
}

/**
 * Securely erases sensitive data from memory
 * 
 * @param buffer - The buffer containing sensitive data
 */
export function secureErase(buffer: Uint8Array | Buffer): void {
  // Overwrite the buffer with random data
  window.crypto.getRandomValues(buffer);

  // Overwrite again with zeros
  buffer.fill(0);
}

// Helper functions

/**
 * Converts a hexadecimal string to a Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  // Check if hex is undefined or null
  if (!hex) {
    throw new Error('Invalid hex string: undefined or null');
  }

  // Remove '0x' prefix if present
  hex = hex.startsWith('0x') ? hex.slice(2) : hex;

  // Ensure even length
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  return bytes;
}

/**
 * Converts a Uint8Array to a hexadecimal string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a Uint8Array to a base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes)
    .map(byte => String.fromCharCode(byte))
    .join('');

  return btoa(binString);
}

/**
 * Converts a base64 string to a Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);

  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }

  return bytes;
}
