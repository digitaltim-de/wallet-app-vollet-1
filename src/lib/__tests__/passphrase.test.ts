import { deriveDbName } from '../passphrase';

// Mock the crypto.subtle.digest function
const mockDigest = jest.fn();
Object.defineProperty(global.crypto.subtle, 'digest', {
  value: mockDigest
});

// Mock TextEncoder
const mockEncode = jest.fn();
global.TextEncoder = jest.fn().mockImplementation(() => ({
  encode: mockEncode
}));

// Mock btoa
global.btoa = jest.fn();

describe('passphrase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks for a successful test
    mockEncode.mockReturnValue(new Uint8Array([1, 2, 3]));
    mockDigest.mockResolvedValue(new ArrayBuffer(32));
    global.btoa.mockReturnValue('abcdefghijklmnopqrstuvwxyz+/=');
  });
  
  describe('deriveDbName', () => {
    it('should derive a database name from a passphrase', async () => {
      const result = await deriveDbName('test-passphrase');
      
      // Verify TextEncoder was called with the passphrase
      expect(mockEncode).toHaveBeenCalledWith('test-passphrase');
      
      // Verify crypto.subtle.digest was called with SHA-256 and the encoded passphrase
      expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
      
      // Verify btoa was called with the digest result
      expect(global.btoa).toHaveBeenCalled();
      
      // Verify the result is a string with the expected prefix
      expect(result).toMatch(/^bp_/);
      
      // Verify the result doesn't contain invalid characters for IndexedDB names
      expect(result).not.toMatch(/\+/);
      expect(result).not.toMatch(/\//);
      expect(result).not.toMatch(/=/);
    });
    
    it('should return different names for different passphrases', async () => {
      // Mock different digest results for different passphrases
      mockDigest
        .mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer)
        .mockResolvedValueOnce(new Uint8Array([4, 5, 6]).buffer);
      
      global.btoa
        .mockReturnValueOnce('abc+/=')
        .mockReturnValueOnce('def+/=');
      
      const result1 = await deriveDbName('passphrase1');
      const result2 = await deriveDbName('passphrase2');
      
      expect(result1).not.toEqual(result2);
    });
    
    it('should return the same name for the same passphrase', async () => {
      // Mock the same digest result for the same passphrase
      mockDigest
        .mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer)
        .mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer);
      
      global.btoa
        .mockReturnValueOnce('abc+/=')
        .mockReturnValueOnce('abc+/=');
      
      const result1 = await deriveDbName('same-passphrase');
      const result2 = await deriveDbName('same-passphrase');
      
      expect(result1).toEqual(result2);
    });
  });
});