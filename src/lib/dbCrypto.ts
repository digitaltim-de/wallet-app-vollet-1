/**
 * Database encryption utilities
 * 
 * This module provides functions for:
 * - Encrypting database exports with AES-256-GCM
 * - Decrypting database imports
 * - Key derivation using PBKDF2 (as a substitute for Argon2id)
 * 
 * Note: Ideally, we would use Argon2id for key derivation as specified,
 * but since we don't have access to install new packages, we're using
 * PBKDF2 with increased iterations as a substitute.
 */

// Constants
const PBKDF2_ITERATIONS = 600000; // Increased iterations to compensate for not using Argon2id
const SALT_LENGTH = 16; // 16 bytes salt
const IV_LENGTH = 12; // 12 bytes IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes authentication tag
const AES_KEY_LENGTH = 256; // 256-bit AES key

/**
 * Derives a key from a passphrase using PBKDF2
 * 
 * @param passphrase - The passphrase to derive the key from
 * @param salt - The salt to use for key derivation
 * @returns A Promise resolving to a CryptoKey
 */
async function deriveKeyForDb(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
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

  // Derive the key using PBKDF2 with increased iterations
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
 * Encrypts data using AES-256-GCM
 * 
 * @param data - The data to encrypt (string)
 * @param passphrase - The passphrase to use for encryption
 * @returns A Promise resolving to the encrypted data in base64 format (salt|iv|authTag|ciphertext)
 */
export async function encryptData(data: string, passphrase: string): Promise<string> {
  // Convert data to ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate a random salt
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Derive a key from the passphrase and salt
  const cryptoKey = await deriveKeyForDb(passphrase, salt);

  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: AUTH_TAG_LENGTH * 8
    },
    cryptoKey,
    dataBuffer
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
 * Decrypts data using AES-256-GCM
 * 
 * @param encryptedBase64 - The encrypted data in base64 format (salt|iv|authTag|ciphertext)
 * @param passphrase - The passphrase to use for decryption
 * @returns A Promise resolving to the decrypted data as a string
 */
export async function decryptData(encryptedBase64: string, passphrase: string): Promise<string> {
  // Convert base64 to ArrayBuffer
  const encryptedBytes = base64ToBytes(encryptedBase64);

  // Extract the salt, IV, and encrypted data
  const salt = encryptedBytes.slice(0, SALT_LENGTH);
  const iv = encryptedBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encryptedData = encryptedBytes.slice(SALT_LENGTH + IV_LENGTH);

  // Derive a key from the passphrase and salt
  const cryptoKey = await deriveKeyForDb(passphrase, salt);

  try {
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: AUTH_TAG_LENGTH * 8
      },
      cryptoKey,
      encryptedData
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed. Incorrect passphrase or corrupted data.');
  }
}

/**
 * Converts a Uint8Array to a URL-safe base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes)
    .map(byte => String.fromCharCode(byte))
    .join('');

  // Convert to base64 and make URL-safe by replacing '+' with '-', '/' with '_', and removing padding '='
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Converts a URL-safe base64 string to a Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  // Convert URL-safe base64 to standard base64 by replacing '-' with '+', '_' with '/'
  let standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (standardBase64.length % 4) {
    standardBase64 += '=';
  }

  const binString = atob(standardBase64);
  const bytes = new Uint8Array(binString.length);

  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }

  return bytes;
}
