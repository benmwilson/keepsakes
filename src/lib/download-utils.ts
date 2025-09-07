export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

export async function downloadMultipleFiles(urls: string[], baseFilename: string): Promise<void> {
  try {
    // Download files sequentially to avoid overwhelming the browser
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const extension = getFileExtension(url);
      const filename = `${baseFilename}_${i + 1}${extension}`;
      
      await downloadFile(url, filename);
      
      // Small delay between downloads
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error('Multiple file download failed:', error);
    throw error;
  }
}

export function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDotIndex = pathname.lastIndexOf('.');
    
    if (lastDotIndex !== -1) {
      const extension = pathname.substring(lastDotIndex);
      // Handle common image and video extensions
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.webm'].includes(extension.toLowerCase())) {
        return extension;
      }
    }
    
    // Default extensions based on URL patterns
    if (url.includes('video') || url.includes('mp4')) return '.mp4';
    if (url.includes('image') || url.includes('photo')) return '.jpg';
    
    return '.jpg'; // Default fallback
  } catch {
    return '.jpg'; // Default fallback
  }
}

export function generateFilename(keepsakeName: string, authorName?: string, index?: number): string {
  const sanitizedName = keepsakeName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  const author = authorName ? `_${authorName.replace(/[^a-zA-Z0-9\s-]/g, '').trim()}` : '';
  const suffix = index !== undefined ? `_${index + 1}` : '';
  
  return `keepsake_${sanitizedName}${author}${suffix}`;
}
