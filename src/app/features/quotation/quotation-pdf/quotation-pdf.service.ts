import { Injectable } from '@angular/core';
import type { Content, TDocumentDefinitions } from 'pdfmake/build/pdfmake';
import { CompanySettings, Quotation, QuotationItem } from '../../../shared/models/quotation.model';
import { LogoService } from '../../../shared/services/logo.service';
import { pdfMake, PdfFontService } from '../../../shared/services/pdf-font.service';

@Injectable({ providedIn: 'root' })
export class QuotationPdfService {
  private readonly navy = '#1A345B';
  private readonly gold = '#C9A44C';
  private readonly lightRow = '#E8EEF4';
  private readonly white = '#FFFFFF';
  private readonly border = '#1A345B';

  constructor(
    private readonly logoService: LogoService,
    private readonly pdfFontService: PdfFontService
  ) {}

  async generatePdf(quotation: Quotation, company: CompanySettings): Promise<Blob> {
    await this.pdfFontService.ensureFontsLoaded();
    const docDefinition = await this.buildDocument(quotation, company);
    const blob = await pdfMake.createPdf(docDefinition).getBlob();
    if (!blob || blob.size === 0) {
      throw new Error('PDF generation failed: empty output');
    }
    return blob;
  }

  async downloadPdf(quotation: Quotation, company: CompanySettings): Promise<void> {
    await this.pdfFontService.ensureFontsLoaded();
    const docDefinition = await this.buildDocument(quotation, company);
    await pdfMake.createPdf(docDefinition).download(`Quotation-${quotation.quotationNo}.pdf`);
  }

  private async buildDocument(
    quotation: Quotation,
    company: CompanySettings
  ): Promise<TDocumentDefinitions> {
    const logo = await this.logoService.resolveLogo(company.logoBase64, company.logoUrl);
    const termsText = quotation.remarks?.trim() || company.termsAndConditions;

    return {
      pageSize: 'A4',
      pageMargins: [0, 0, 0, 0],
      defaultStyle: { font: 'Roboto', fontSize: 9, color: this.navy },
      styles: {
        headerCompany: { fontSize: 20, bold: true, color: this.white },
        headerAddress: { fontSize: 8, color: this.white, lineHeight: 1.2 },
        headerMetaLabel: { fontSize: 9, bold: true, color: this.gold },
        headerMetaValue: { fontSize: 9, color: this.white },
        contractTitle: { fontSize: 14, bold: true, color: this.white, alignment: 'center' },
        gridLabel: { fontSize: 9, bold: true, color: this.navy },
        gridValue: { fontSize: 9, color: '#111111' },
        tableHeader: { fontSize: 9, bold: true, color: this.white },
        tableCell: { fontSize: 9, color: '#111111' },
        grandTotalLabel: { fontSize: 10, bold: true, color: this.white },
        grandTotalValue: { fontSize: 11, bold: true, color: this.gold },
        termsHeader: { fontSize: 10, bold: true, color: this.white },
        termsBody: { fontSize: 9, color: '#111111', lineHeight: 1.35 },
        footerText: { fontSize: 9.5, color: this.white, italics: true, alignment: 'center' },
      },
      content: [
        this.buildHeader(logo, company, quotation),
        this.buildContractBar(company.documentTitle),
        this.buildInfoGrid(quotation, company),
        this.buildItemsTable(quotation),
        this.buildTermsSection(termsText),
        this.buildFooter(company.footerText),
      ],
    };
  }

  private buildHeader(
    logo: string | null,
    company: CompanySettings,
    quotation: Quotation
  ): Content {
    const arabicBlock: Content = company.companyNameArabic
      ? {
          text: this.formatArabicForPdf(company.companyNameArabic),
          font: 'Amiri',
          alignment: 'center',
          fontSize: 14,
          color: this.gold,
          margin: [0, 2, 0, 0],
        }
      : { text: '' };

    return {
      table: {
        widths: [108, '*', 128],
        heights: [96, 26],
        body: [
          [
            logo
              ? {
                  image: logo,
                  width: 86,
                  height: 86,
                  alignment: 'center',
                  margin: [10, 6, 0, 0],
                  border: [false, false, false, false],
                }
              : { text: '', border: [false, false, false, false] },
            {
              stack: [
                {
                  text: company.companyName.toUpperCase(),
                  style: 'headerCompany',
                  alignment: 'center',
                  margin: [0, 14, 0, 0],
                },
                arabicBlock,
              ],
              border: [false, false, false, false],
            },
            {
              stack: [
                {
                  text: [
                    { text: 'Date: ', style: 'headerMetaLabel' },
                    { text: this.formatDateShort(quotation.quotationDate), style: 'headerMetaValue' },
                  ],
                  alignment: 'right',
                  margin: [0, 16, 12, 3],
                },
                {
                  text: [
                    { text: 'Quotation #: ', style: 'headerMetaLabel' },
                    { text: String(quotation.quotationNo), style: 'headerMetaValue' },
                  ],
                  alignment: 'right',
                  margin: [0, 0, 12, 0],
                },
              ],
              border: [false, false, false, false],
            },
          ],
          [
            {
              text: company.addressLine1,
              style: 'headerAddress',
              colSpan: 2,
              margin: [12, 0, 0, 8],
              border: [false, false, false, false],
            },
            {},
            { text: '', border: [false, false, false, false] },
          ],
        ],
      },
      layout: {
        fillColor: () => this.navy,
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
    };
  }

  private buildContractBar(title: string): Content {
    return {
      table: {
        widths: ['*'],
        body: [[{ text: title.toUpperCase(), style: 'contractTitle', border: [false, false, false, false] }]],
      },
      layout: {
        fillColor: () => this.gold,
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
    };
  }

  private buildInfoGrid(quotation: Quotation, company: CompanySettings): Content {
    const rows: [string, string, string, string][] = [
      ['Quotation To', quotation.customerName, 'Valid Until', this.formatDateShort(quotation.validUntil)],
      ['Atten', quotation.attention, 'Prepared By', quotation.preparedBy],
      ['Company Name', quotation.companyName, 'Contact No', quotation.preparedContactNo || company.phone],
      ['Contact Number', quotation.contactNo, 'Email', quotation.email || company.email],
      ['Project', quotation.projectName, '', ''],
      ['Phone', quotation.phone, '', ''],
    ];

    return {
      table: {
        widths: [102, '*', 102, '*'],
        body: rows.map(([l1, v1, l2, v2], index) => [
          this.gridLabelCell(l1, index),
          this.gridValueCell(v1, index),
          this.gridLabelCell(l2, index),
          this.gridValueCell(v2, index),
        ]),
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        hLineColor: () => this.border,
        vLineColor: () => this.border,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
    };
  }

  private gridLabelCell(label: string, rowIndex: number): Content {
    return {
      text: label ? `${label}:` : '',
      style: 'gridLabel',
      fillColor: rowIndex % 2 === 0 ? this.lightRow : this.white,
      border: [true, true, true, true],
    };
  }

  private gridValueCell(value: string, rowIndex: number): Content {
    return {
      text: value || '',
      style: 'gridValue',
      fillColor: rowIndex % 2 === 0 ? this.lightRow : this.white,
      border: [true, true, true, true],
    };
  }

  private buildItemsTable(quotation: Quotation): Content {
    const items = quotation.items ?? [];
    const body: Content[][] = [
      [
        { text: 'Sr.', style: 'tableHeader', alignment: 'center' },
        { text: 'Description', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader', alignment: 'center' },
        { text: 'Unit Price (AED)', style: 'tableHeader', alignment: 'center' },
        { text: 'Total (AED)', style: 'tableHeader', alignment: 'center' },
      ],
      ...items.map((item: QuotationItem, index: number) => [
        { text: String(item.srNo), style: 'tableCell', alignment: 'center', fillColor: this.rowColor(index) },
        { text: item.description, style: 'tableCell', fillColor: this.rowColor(index) },
        { text: this.formatQty(item.quantity), style: 'tableCell', alignment: 'center', fillColor: this.rowColor(index) },
        {
          text: item.unitPrice ? this.formatAmount(item.unitPrice) : '',
          style: 'tableCell',
          alignment: 'center',
          fillColor: this.rowColor(index),
        },
        {
          text: item.total ? this.formatAmount(item.total) : '',
          style: 'tableCell',
          alignment: 'center',
          fillColor: this.rowColor(index),
        },
      ]),
      [
        { text: 'GRAND TOTAL (AED)', style: 'grandTotalLabel', colSpan: 4, alignment: 'right', margin: [0, 5, 10, 5] },
        {},
        {},
        {},
        {
          text: this.formatAmount(quotation.grandTotal),
          style: 'grandTotalValue',
          alignment: 'center',
          margin: [0, 5, 0, 5],
        },
      ],
    ];

    return {
      table: {
        headerRows: 1,
        widths: [32, '*', 48, 78, 68],
        body,
      },
      layout: {
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        hLineColor: () => this.border,
        vLineColor: () => this.border,
        fillColor: (rowIndex: number) => (rowIndex === 0 || rowIndex === body.length - 1 ? this.navy : null),
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
    };
  }

  private buildTermsSection(termsText: string): Content {
    const lines = termsText.split('\n').map((line) => line.trim()).filter(Boolean);

    return {
      stack: [
        {
          table: {
            widths: ['*'],
            body: [[{ text: 'TERMS & CONDITIONS', style: 'termsHeader', border: [false, false, false, false] }]],
          },
          layout: {
            fillColor: () => this.navy,
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: () => 7,
            paddingBottom: () => 7,
          },
        },
        {
          table: {
            widths: ['*'],
            body: lines.map((line, index) => [
              {
                text: line,
                style: 'termsBody',
                fillColor: index % 2 === 0 ? this.lightRow : this.white,
                border: [false, false, false, false],
                margin: [10, 6, 10, 6],
              },
            ]),
          },
          layout: {
            hLineWidth: () => 0.75,
            vLineWidth: () => 0.75,
            hLineColor: () => this.border,
            vLineColor: () => this.border,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
        },
      ],
    };
  }

  private buildFooter(footerText: string): Content {
    return {
      table: {
        widths: ['*'],
        body: [[{ text: footerText, style: 'footerText', border: [false, false, false, false], margin: [0, 9, 0, 9] }]],
      },
      layout: {
        fillColor: () => this.gold,
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 10,
        paddingRight: () => 10,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
    };
  }

  private rowColor(index: number): string {
    return index % 2 === 0 ? this.lightRow : this.white;
  }

  private formatDateShort(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatQty(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatAmount(value: number): string {
    if (Number.isInteger(value) || value % 1 === 0) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * pdfmake lays out text left-to-right and does not apply the Unicode bidi
   * algorithm, so Arabic logical order must be reversed word-by-word before
   * rendering.
   */
  private formatArabicForPdf(text: string): string {
    return text
      .trim()
      .split(/\s+/)
      .reverse()
      .join(' ');
  }
}
