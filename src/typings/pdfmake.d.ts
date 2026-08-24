declare module 'pdfmake/build/pdfmake' {
  export interface Content {
    [key: string]: unknown;
  }

  export interface TDocumentDefinitions {
    [key: string]: unknown;
  }

  const pdfMake: {
    createPdf(docDefinition: TDocumentDefinitions): {
      open(): Promise<void>;
      download(filename?: string): Promise<void>;
      getBlob(): Promise<Blob>;
    };
    addVirtualFileSystem(vfs: Record<string, string>): void;
    addFonts(fonts: Record<string, Record<string, string>>): void;
  };
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: Record<string, string>;
  export default pdfFonts;
}
