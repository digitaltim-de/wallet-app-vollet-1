import { openAccountDB } from '../dbFactory';
import { openDB } from 'idb';

// Mock the idb openDB function
jest.mock('idb', () => ({
  openDB: jest.fn()
}));

describe('dbFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('openAccountDB', () => {
    it('should open a database with the specified name', async () => {
      // Mock implementation for openDB
      const mockDB = {
        createObjectStore: jest.fn()
      };
      
      (openDB as jest.Mock).mockResolvedValue(mockDB);
      
      // Call the function
      const result = await openAccountDB('test-db-name');
      
      // Verify openDB was called with the correct parameters
      expect(openDB).toHaveBeenCalledWith('test-db-name', 1, expect.any(Object));
      
      // Verify the result is the mock DB
      expect(result).toBe(mockDB);
    });
    
    it('should create a meta object store during upgrade', async () => {
      // Mock implementation for openDB that calls the upgrade function
      const mockCreateObjectStore = jest.fn();
      const mockDB = {
        createObjectStore: mockCreateObjectStore
      };
      
      (openDB as jest.Mock).mockImplementation((name, version, { upgrade }) => {
        upgrade(mockDB);
        return Promise.resolve(mockDB);
      });
      
      // Call the function
      await openAccountDB('test-db-name');
      
      // Verify createObjectStore was called with the correct parameters
      expect(mockCreateObjectStore).toHaveBeenCalledWith('meta', { keyPath: 'id' });
    });
  });
});