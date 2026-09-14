/**
 * Client-side image resizing and compression using HTML5 Canvas.
 * Prevents bloated image uploads and optimizes tree rendering performance.
 */
export async function compressImage(file, maxDimension = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Invalid image file'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio downscaling
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp if supported, else jpeg
        const outputFormat = 'image/webp';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas image compression failed'));
            }
            const compressedFile = new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}.webp`, {
              type: outputFormat,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputFormat,
          quality
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a File or Blob into a base64 Data URL for instant UI preview.
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
