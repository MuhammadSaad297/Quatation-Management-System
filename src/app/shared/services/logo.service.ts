import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LogoService {
  private cache = new Map<string, string>();

  async resolveLogo(logoBase64: string | null, logoUrl: string | null): Promise<string | null> {
    if (logoBase64) {
      return this.compressImage(logoBase64, 200, 200);
    }

    const url = logoUrl || '/Logo_transparent.png';
    if (this.cache.has(url)) return this.cache.get(url)!;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      const compressed = await this.compressImage(base64, 200, 200);
      this.cache.set(url, compressed);
      return compressed;
    } catch {
      return null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private compressImage(dataUrl: string, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}
