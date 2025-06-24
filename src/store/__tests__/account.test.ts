import { useAccountStore } from '../account';
import { deriveDbName } from '@/lib/passphrase';
import { openAccountDB } from '@/lib/dbFactory';

// Mock the passphrase and dbFactory modules
jest.mock('@/lib/passphrase', () => ({
  deriveDbName: jest.fn()
}));

jest.mock('@/lib/dbFactory', () => ({
  openAccountDB: jest.fn()
}));

// Mock indexedDB.databases
const mockDatabases = jest.fn();
Object.defineProperty(window, 'indexedDB', {
  value: {
    databases: mockDatabases
  }
});

// Mock navigator.storage.persist
const mockPersist = jest.fn();
Object.defineProperty(window.navigator, 'storage', {
  value: {
    persist: mockPersist
  },
  configurable: true
});

describe('account store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the store to its initial state
    const { lock } = useAccountStore.getState();
    lock();
    
    // Setup default mocks
    mockDatabases.mockResolvedValue([]);
    mockPersist.mockResolvedValue(true);
    (deriveDbName as jest.Mock).mockResolvedValue('bp_test');
  });
  
  describe('login', () => {
    it('should return not-found if the database does not exist', async () => {
      // Mock empty database list
      mockDatabases.mockResolvedValue([]);
      
      // Call the function
      const { login } = useAccountStore.getState();
      const result = await login('test-pass');
      
      // Verify the result
      expect(result).toBe('not-found');
      
      // Verify the store state
      const { unlocked, db } = useAccountStore.getState();
      expect(unlocked).toBe(false);
      expect(db).toBeUndefined();
    });
    
    it('should return ok and set unlocked to true if login is successful', async () => {
      // Mock database list with the derived name
      mockDatabases.mockResolvedValue([{ name: 'bp_test' }]);
      
      // Mock successful database open
      const mockDB = {
        get: jest.fn().mockResolvedValue({ id: 'singleton', createdAt: Date.now() })
      };
      (openAccountDB as jest.Mock).mockResolvedValue(mockDB);
      
      // Call the function
      const { login } = useAccountStore.getState();
      const result = await login('test-pass');
      
      // Verify the result
      expect(result).toBe('ok');
      
      // Verify the store state
      const { unlocked, db } = useAccountStore.getState();
      expect(unlocked).toBe(true);
      expect(db).toBe(mockDB);
    });
    
    it('should return wrong-pass if the database exists but cannot be opened', async () => {
      // Mock database list with the derived name
      mockDatabases.mockResolvedValue([{ name: 'bp_test' }]);
      
      // Mock failed database open
      (openAccountDB as jest.Mock).mockRejectedValue(new Error('Failed to open'));
      
      // Call the function
      const { login } = useAccountStore.getState();
      const result = await login('test-pass');
      
      // Verify the result
      expect(result).toBe('wrong-pass');
      
      // Verify the store state
      const { unlocked, db } = useAccountStore.getState();
      expect(unlocked).toBe(false);
      expect(db).toBeUndefined();
    });
  });
  
  describe('createAccount', () => {
    it('should return exists if the database already exists', async () => {
      // Mock database list with the derived name
      mockDatabases.mockResolvedValue([{ name: 'bp_test' }]);
      
      // Call the function
      const { createAccount } = useAccountStore.getState();
      const result = await createAccount('test-pass');
      
      // Verify the result
      expect(result).toBe('exists');
      
      // Verify the store state
      const { unlocked, db } = useAccountStore.getState();
      expect(unlocked).toBe(false);
      expect(db).toBeUndefined();
    });
    
    it('should create a new database and return created if successful', async () => {
      // Mock empty database list
      mockDatabases.mockResolvedValue([]);
      
      // Mock successful database open
      const mockDB = {
        put: jest.fn().mockResolvedValue(undefined)
      };
      (openAccountDB as jest.Mock).mockResolvedValue(mockDB);
      
      // Call the function
      const { createAccount } = useAccountStore.getState();
      const result = await createAccount('test-pass');
      
      // Verify the result
      expect(result).toBe('created');
      
      // Verify the database was initialized
      expect(mockDB.put).toHaveBeenCalledWith('meta', expect.objectContaining({
        id: 'singleton',
        createdAt: expect.any(Number)
      }));
      
      // Verify persistent storage was requested
      expect(mockPersist).toHaveBeenCalled();
      
      // Verify the store state
      const { unlocked, db } = useAccountStore.getState();
      expect(unlocked).toBe(true);
      expect(db).toBe(mockDB);
    });
  });
  
  describe('lock', () => {
    it('should close the database and reset the state', async () => {
      // Setup an unlocked state with a mock database
      const mockDB = {
        close: jest.fn(),
        get: jest.fn().mockResolvedValue({ id: 'singleton', createdAt: Date.now() })
      };
      
      // Mock database list with the derived name
      mockDatabases.mockResolvedValue([{ name: 'bp_test' }]);
      
      // Mock successful database open
      (openAccountDB as jest.Mock).mockResolvedValue(mockDB);
      
      // Login to set up the state
      const { login, lock } = useAccountStore.getState();
      await login('test-pass');
      
      // Verify the state is set up correctly
      let { unlocked, db } = useAccountStore.getState();
      expect(unlocked).toBe(true);
      expect(db).toBe(mockDB);
      
      // Call the lock function
      lock();
      
      // Verify the database was closed
      expect(mockDB.close).toHaveBeenCalled();
      
      // Verify the state was reset
      ({ unlocked, db } = useAccountStore.getState());
      expect(unlocked).toBe(false);
      expect(db).toBeUndefined();
    });
  });
});