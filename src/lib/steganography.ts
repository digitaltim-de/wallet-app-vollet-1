/**
 * Steganography utility functions for embedding and extracting data from images
 */

/**
 * Embeds encrypted data into a PNG image using steganography
 * @param imageUrl - URL of the template image
 * @param data - Encrypted data to embed
 * @returns Promise that resolves to a data URL of the image with embedded data
 */
export async function embedDataInImage(imageUrl: string, data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new image element
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          // Create a canvas element
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Set canvas dimensions to match the image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image on the canvas
          ctx.drawImage(img, 0, 0);
          
          // Use steganography.js to hide the data in the image
          // @ts-ignore - steganography.js doesn't have TypeScript definitions
          const steg = new window.steganography();
          const dataUrl = steg.encode(data, canvas.toDataURL('image/png'));
          
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the source of the image
      img.src = imageUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Extracts encrypted data from a PNG image using steganography
 * @param imageFile - File object of the uploaded image
 * @returns Promise that resolves to the extracted data
 */
export async function extractDataFromImage(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target || typeof event.target.result !== 'string') {
            reject(new Error('Failed to read image file'));
            return;
          }
          
          const dataUrl = event.target.result;
          
          // Create a new image element
          const img = new Image();
          
          img.onload = () => {
            try {
              // Use steganography.js to extract the data from the image
              // @ts-ignore - steganography.js doesn't have TypeScript definitions
              const steg = new window.steganography();
              const extractedData = steg.decode(dataUrl);
              
              if (!extractedData) {
                reject(new Error('No data found in image'));
                return;
              }
              
              resolve(extractedData);
            } catch (error) {
              reject(error);
            }
          };
          
          img.onerror = () => {
            reject(new Error('Failed to load image from data URL'));
          };
          
          img.src = dataUrl;
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      
      // Read the image file as a data URL
      reader.readAsDataURL(imageFile);
    } catch (error) {
      reject(error);
    }
  });
}