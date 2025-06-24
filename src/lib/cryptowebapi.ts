/**
 * CryptoWebAPI Client
 * 
 * This module provides a client for interacting with the CryptoWebAPI service.
 * It includes methods for wallet operations, blockchain queries, and information retrieval.
 * 
 * All methods include retry logic and proper error handling.
 */

// Types for API responses
export type Network = 'ethereum' | 'bnb' | 'tron' | 'bitcoin';
export type Mode = 'mainnet' | 'testnet';

// Error types
export class CryptoWebApiError extends Error {
  statusCode?: number;
  
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'CryptoWebApiError';
    this.statusCode = statusCode;
  }
}

export class NetworkError extends CryptoWebApiError {
  constructor(message: string) {
    super(`Network error: ${message}`);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends CryptoWebApiError {
  constructor() {
    super('Authentication failed. Invalid API key.', 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends CryptoWebApiError {
  constructor() {
    super('Rate limit exceeded. Please try again later.', 429);
    this.name = 'RateLimitError';
  }
}

// Response types
export interface WalletCreateResponse {
  address: string;
  privateKey: string;
  network: Network;
}

export interface Balance {
  symbol: string;
  name: string;
  balance: string;
  balanceDecimal: number;
  usdValue: number;
  contractAddress?: string;
  decimals: number;
  isNative: boolean;
}

export interface WalletBalanceResponse {
  address: string;
  network: Network;
  balances: Balance[];
  totalUsdValue: number;
}

export interface Transaction {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  valueDecimal: number;
  fee: string;
  feeDecimal: number;
  status: 'success' | 'pending' | 'failed';
  tokenSymbol?: string;
  tokenName?: string;
  contractAddress?: string;
  type: 'transfer' | 'contract' | 'token_transfer';
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface SendTransactionResponse {
  txHash: string;
  network: Network;
  status: 'pending' | 'success';
}

export interface SupportedCoin {
  symbol: string;
  name: string;
  network: Network;
  contractAddress?: string;
  decimals: number;
  usdPrice: number;
  isNative: boolean;
}

export interface SupportedCoinsResponse {
  coins: SupportedCoin[];
}

export interface ValidateAddressResponse {
  address: string;
  network: Network;
  isValid: boolean;
}

// Helper function for retrying API calls
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = 2,
  backoff = 300
): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError();
      }
      
      if (response.status === 429) {
        throw new RateLimitError();
      }
      
      const errorText = await response.text();
      throw new CryptoWebApiError(
        `API error: ${errorText || response.statusText}`,
        response.status
      );
    }
    
    return await response.json() as T;
  } catch (error) {
    if (error instanceof CryptoWebApiError) {
      throw error;
    }
    
    if (retries > 0) {
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry<T>(url, options, retries - 1, backoff * 2);
    }
    
    throw new NetworkError((error as Error).message);
  }
}

// Base API URL
const API_BASE_URL = 'https://api.cryptowebapi.com/api';

// API client class
export class CryptoWebApi {
  private apiKey: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CRYPTOWEBAPI_KEY || '';
    
    if (!this.apiKey) {
      console.warn('CryptoWebApi initialized without API key. API calls will fail.');
    }
  }
  
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
  }
  
  /**
   * Create a new wallet for the specified network
   * 
   * @param network - The blockchain network
   * @returns A Promise resolving to the created wallet data
   */
  async createWallet(network: Network): Promise<WalletCreateResponse> {
    const url = new URL(`${API_BASE_URL}/wallet/create`);
    url.searchParams.append('network', network);
    
    return fetchWithRetry<WalletCreateResponse>(
      url.toString(),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
  }
  
  /**
   * Get the balance of a wallet
   * 
   * @param network - The blockchain network
   * @param address - The wallet address
   * @param tokens - Optional list of token contract addresses to include
   * @param mode - Optional network mode (mainnet/testnet)
   * @returns A Promise resolving to the wallet balance data
   */
  async getBalance(
    network: Network,
    address: string,
    tokens?: string[],
    mode: Mode = 'mainnet'
  ): Promise<WalletBalanceResponse> {
    const url = new URL(`${API_BASE_URL}/wallet/balance`);
    url.searchParams.append('network', network);
    
    return fetchWithRetry<WalletBalanceResponse>(
      url.toString(),
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          address,
          tokens,
          mode,
        }),
      }
    );
  }
  
  /**
   * List transactions for a wallet
   * 
   * @param network - The blockchain network
   * @param address - The wallet address
   * @param options - Optional parameters for filtering and pagination
   * @returns A Promise resolving to the transaction list
   */
  async listTransactions(
    network: Network,
    address: string,
    options?: {
      limit?: number;
      offset?: number;
      fromTimestamp?: number | string;
      toTimestamp?: number | string;
      sortBy?: 'timestamp' | 'valueDecimal' | 'feeDecimal';
      sortOrder?: 'asc' | 'desc';
      tokenSymbol?: string;
      txType?: 'transfer' | 'contract' | 'token_transfer';
    }
  ): Promise<TransactionsResponse> {
    const url = new URL(`${API_BASE_URL}/blockchain/transactions`);
    url.searchParams.append('network', network);
    url.searchParams.append('address', address);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return fetchWithRetry<TransactionsResponse>(
      url.toString(),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
  }
  
  /**
   * Send a raw transaction to the blockchain
   * 
   * @param network - The blockchain network
   * @param rawTx - The raw transaction hex
   * @param mode - Optional network mode (mainnet/testnet)
   * @returns A Promise resolving to the transaction result
   */
  async sendRawTransaction(
    network: Network,
    rawTx: string,
    mode: Mode = 'mainnet'
  ): Promise<SendTransactionResponse> {
    const url = new URL(`${API_BASE_URL}/wallet/send`);
    
    return fetchWithRetry<SendTransactionResponse>(
      url.toString(),
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          network,
          rawTx,
          mode,
        }),
      }
    );
  }
  
  /**
   * Get a list of supported coins and tokens
   * 
   * @param network - Optional network to filter by
   * @returns A Promise resolving to the list of supported coins
   */
  async getSupportedCoins(network?: Network): Promise<SupportedCoinsResponse> {
    const url = new URL(`${API_BASE_URL}/info/supported-coins`);
    
    if (network) {
      url.searchParams.append('network', network);
    }
    
    return fetchWithRetry<SupportedCoinsResponse>(
      url.toString(),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
  }
  
  /**
   * Validate a wallet address
   * 
   * @param network - The blockchain network
   * @param address - The wallet address to validate
   * @returns A Promise resolving to the validation result
   */
  async validateAddress(
    network: Network,
    address: string
  ): Promise<ValidateAddressResponse> {
    const url = new URL(`${API_BASE_URL}/info/wallet-validation`);
    url.searchParams.append('network', network);
    url.searchParams.append('address', address);
    
    return fetchWithRetry<ValidateAddressResponse>(
      url.toString(),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
  }
}

// Export a singleton instance
export const cryptowebapi = new CryptoWebApi();