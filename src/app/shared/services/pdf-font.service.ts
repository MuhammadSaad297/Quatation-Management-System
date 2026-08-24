import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

type PdfMakeExtended = typeof pdfMake & {
  addVirtualFileSystem(vfs: Record<string, string>): void;
  addFonts(fonts: Record<string, Record<string, string>>): void;
  _fontsReady?: boolean;
};

const pdf = pdfMake as PdfMakeExtended;

// Register Roboto immediately (required by pdfmake 0.3.x API)
pdf.addVirtualFileSystem(pdfFonts as Record<string, string>);
pdf.addFonts({
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
});

@Injectable({ providedIn: 'root' })
export class PdfFontService {
  private fontsReady: Promise<void> | null = null;

  ensureFontsLoaded(): Promise<void> {
    if (!this.fontsReady) {
      this.fontsReady = this.loadArabicFonts();
    }
    return this.fontsReady;
  }

  private async loadArabicFonts(): Promise<void> {
    if (pdf._fontsReady) return;

    const [regular, bold] = await Promise.all([
      this.fetchFontBase64('/fonts/Amiri-Regular.ttf'),
      this.fetchFontBase64('/fonts/Amiri-Bold.ttf'),
    ]);

    pdf.addVirtualFileSystem({
      'Amiri-Regular.ttf': regular,
      'Amiri-Bold.ttf': bold,
    });

    pdf.addFonts({
      Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Bold.ttf',
      },
    });

    pdf._fontsReady = true;
  }

  private async fetchFontBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load font: ${url}`);
    }
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export { pdfMake };
