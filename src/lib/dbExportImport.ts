/**
 * Database export and import utilities
 * 
 * This module provides functions for:
 * - Exporting an IndexedDB database to base64
 * - Importing an IndexedDB database from base64
 */

/**
 * Export an IndexedDB database to base64
 * 
 * @param dbName - The name of the database to export
 * @returns A Promise resolving to a base64 string representation of the database
 */
export async function exportDatabaseToBase64(dbName: string): Promise<string> {
  try {
    // Open the database
    const request = indexedDB.open(dbName);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        reject(new Error(`Failed to open database: ${dbName}`));
      };

      request.onsuccess = async () => {
        const db = request.result;
        const exportData: Record<string, any[]> = {};
        const storeNames = Array.from(db.objectStoreNames);
        const storeSchemas: Record<string, any> = {};

        // If there are no object stores, return an empty database
        if (storeNames.length === 0) {
          db.close();
          const emptyExport = JSON.stringify({ dbName, stores: {}, schemas: {} });
          return resolve(btoa(emptyExport));
        }

        // Create a transaction to read all data
        const transaction = db.transaction(storeNames, 'readonly');
        let storesCompleted = 0;

        // Process each object store
        storeNames.forEach(storeName => {
          const objectStore = transaction.objectStore(storeName);
          exportData[storeName] = [];

          // Store schema information
          const keyPath = objectStore.keyPath;
          const autoIncrement = objectStore.autoIncrement;
          const indexes: Record<string, { keyPath: string | string[], unique: boolean, multiEntry: boolean }> = {};

          // Get index information
          for (let i = 0; i < objectStore.indexNames.length; i++) {
            const indexName = objectStore.indexNames[i];
            const index = objectStore.index(indexName);
            indexes[indexName] = {
              keyPath: index.keyPath,
              unique: index.unique,
              multiEntry: index.multiEntry
            };
          }

          storeSchemas[storeName] = {
            keyPath,
            autoIncrement,
            indexes
          };

          // Get all records from the store
          const getAllRequest = objectStore.getAll();

          getAllRequest.onsuccess = () => {
            exportData[storeName] = getAllRequest.result;
            storesCompleted++;

            // When all stores are processed, encode and resolve
            if (storesCompleted === storeNames.length) {
              db.close();
              const exportObj = {
                dbName,
                stores: exportData,
                schemas: storeSchemas,
                version: db.version
              };
              const exportString = JSON.stringify(exportObj);
              resolve(btoa(exportString));
            }
          };

          getAllRequest.onerror = () => {
            db.close();
            reject(new Error(`Failed to read data from store: ${storeName}`));
          };
        });

        transaction.onerror = () => {
          db.close();
          reject(new Error('Transaction failed'));
        };
      };
    });
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

/**
 * Import an IndexedDB database from base64
 * 
 * @param base64Data - The base64 string representation of the database
 * @returns A Promise resolving to the name of the imported database
 */
export async function importDatabaseFromBase64(base64Data: string): Promise<string> {
  try {
    // Decode the base64 data
    const jsonString = atob(base64Data);
    const importData = JSON.parse(jsonString);
    const { dbName, stores, schemas, version } = importData;

    if (!dbName) {
      throw new Error('Invalid import data: missing database name');
    }

    // Delete the existing database if it exists
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(new Error(`Failed to delete existing database: ${dbName}`));
    });

    // Open the database to create it with the schema
    const request = indexedDB.open(dbName, version || 1);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        reject(new Error(`Failed to open database for import: ${dbName}`));
      };

      // Create object stores and indexes
      request.onupgradeneeded = (event) => {
        const db = request.result;

        // If there are no schemas to import, just return
        if (!schemas || Object.keys(schemas).length === 0) {
          return;
        }

        // Create each object store with its schema
        Object.entries(schemas).forEach(([storeName, schema]: [string, any]) => {
          // Create the object store
          const objectStore = db.createObjectStore(storeName, {
            keyPath: schema.keyPath,
            autoIncrement: schema.autoIncrement
          });

          // Create indexes
          if (schema.indexes) {
            Object.entries(schema.indexes).forEach(([indexName, indexInfo]: [string, any]) => {
              objectStore.createIndex(indexName, indexInfo.keyPath, {
                unique: indexInfo.unique,
                multiEntry: indexInfo.multiEntry
              });
            });
          }
        });
      };

      request.onsuccess = async () => {
        const db = request.result;

        // If there are no stores to import, just return the database name
        if (!stores || Object.keys(stores).length === 0) {
          db.close();
          return resolve(dbName);
        }

        // Create a transaction to write all data
        const storeNames = Object.keys(stores);
        const transaction = db.transaction(storeNames, 'readwrite');
        let storesCompleted = 0;

        // Process each object store
        storeNames.forEach(storeName => {
          const objectStore = transaction.objectStore(storeName);
          const storeData = stores[storeName];

          // Add each record to the store
          storeData.forEach((record: any) => {
            try {
              objectStore.add(record);
            } catch (e) {
              console.error(`Error adding record to ${storeName}:`, e, record);
            }
          });

          storesCompleted++;

          // When all stores are processed, resolve
          if (storesCompleted === storeNames.length) {
            transaction.oncomplete = () => {
              db.close();
              resolve(dbName);
            };
          }
        });

        transaction.onerror = (event) => {
          console.error('Import transaction error:', event);
          db.close();
          reject(new Error('Import transaction failed'));
        };
      };
    });
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
}
