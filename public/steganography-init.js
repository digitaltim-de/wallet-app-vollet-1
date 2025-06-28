// steganography.js initialization script
// This creates a global steganography constructor

(function() {
  window.steganography = function() {
    this.encode = function(message, image) {
      try {
        return steg.encode(message, image);
      } catch (e) {
        console.error('Steganography encoding error:', e);
        return null;
      }
    };

    this.decode = function(image) {
      try {
        return steg.decode(image);
      } catch (e) {
        console.error('Steganography decoding error:', e);
        return null;
      }
    };
  };
})();
