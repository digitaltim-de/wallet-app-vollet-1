/**
 * Steganography utility functions for embedding and extracting data from images
 */

/**
 * Converts a string to binary representation
 */
function stringToBinary(str: string): string {
  return str.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
}

/**
 * Converts binary to string
 */
function binaryToString(binary: string): string {
  const chars: string[] = [];
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.substr(i, 8);
    if (byte.length === 8) {
      chars.push(String.fromCharCode(parseInt(byte, 2)));
    }
  }
  return chars.join('');
}

/**
 * Embeds encrypted data into a PNG image using LSB steganography
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
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Convert data to binary with delimiter
          const delimiter = '1111111111111110'; // 16 bit delimiter
          const binaryData = stringToBinary(data) + delimiter;
          
          // Check if image has enough pixels to store the data
          const maxBits = pixels.length; // We can use every byte (RGBA channels)
          if (binaryData.length > maxBits) {
            reject(new Error('Image too small to store the data'));
            return;
          }
          
          // Embed binary data in LSB of pixels
          for (let i = 0; i < binaryData.length; i++) {
            const bit = parseInt(binaryData[i]);
            // Clear the least significant bit and set it to our bit
            pixels[i] = (pixels[i] & 0xFE) | bit;
          }
          
          // Put the modified image data back
          ctx.putImageData(imageData, 0, 0);
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
          
        } catch (error) {
          console.error('Error in embedDataInImage:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('Failed to load image:', error);
        reject(new Error('Failed to load image'));
      };
      
      // Set the source of the image
      if (imageUrl.startsWith('/')) {
        img.src = imageUrl;
      } else {
        img.src = imageUrl;
      }

    } catch (error) {
      console.error('Error in embedDataInImage setup:', error);
      reject(error);
    }
  });
}

/**
 * Extracts encrypted data from a PNG image using LSB steganography
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
              
              // Get image data
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const pixels = imageData.data;
              
              // Extract binary data from LSB of pixels
              let binaryData = '';
              const delimiter = '1111111111111110'; // 16 bit delimiter
              
              for (let i = 0; i < pixels.length; i++) {
                // Get the least significant bit
                const bit = pixels[i] & 1;
                binaryData += bit.toString();
                
                // Check if we've reached the delimiter
                if (binaryData.endsWith(delimiter)) {
                  // Remove delimiter from the end
                  binaryData = binaryData.slice(0, -delimiter.length);
                  break;
                }
              }
              
              if (!binaryData || !binaryData.length) {
                reject(new Error('No data found in image'));
                return;
              }
              
              // Convert binary back to string
              const extractedData = binaryToString(binaryData);
              
              if (!extractedData) {
                reject(new Error('Failed to decode data from image'));
                return;
              }
              
              resolve(extractedData);
            } catch (error) {
              console.error('Error extracting data:', error);
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