import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { CompanySettings, Quotation } from '../../../shared/models/quotation.model';
import { QuotationPdfService } from './quotation-pdf.service';

@Component({
  selector: 'app-quotation-pdf-preview',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, ProgressSpinnerModule, MessageModule],
  template: `
    <p-dialog
      header="PDF Preview"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '92vw', maxWidth: '960px' }"
      [breakpoints]="{ '960px': '96vw' }"
      (onHide)="handleHide()"
    >
      @if (loading()) {
        <div class="pdf-loading">
          <p-progressSpinner strokeWidth="4" />
          <p>Generating PDF...</p>
        </div>
      } @else if (errorMessage()) {
        <p-message severity="error" [text]="errorMessage()!" styleClass="w-full" />
      } @else if (safePdfUrl()) {
        <embed
          #pdfEmbed
          [src]="safePdfUrl()"
          type="application/pdf"
          class="pdf-viewer"
        />
      }

      <ng-template pTemplate="footer">
        <p-button label="Close" severity="secondary" [outlined]="true" (onClick)="close()" />
        <p-button
          label="Download"
          icon="bi bi-download"
          [disabled]="!blob"
          (onClick)="download()"
        />
        <p-button
          label="Print"
          icon="bi bi-printer"
          [disabled]="!blob"
          (onClick)="print()"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .pdf-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: var(--text-color-secondary);
    }

    .pdf-viewer {
      width: 100%;
      height: 75vh;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
    }
  `,
})
export class QuotationPdfPreviewComponent implements OnChanges {
  @Input() quotation!: Quotation;
  @Input() company!: CompanySettings;
  @Input() visible = false;
  @Input() autoPrint = false;
  @Output() onClose = new EventEmitter<void>();
  @ViewChild('pdfEmbed') pdfEmbed?: ElementRef<HTMLEmbedElement>;

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly safePdfUrl = signal<SafeResourceUrl | null>(null);
  blob: Blob | null = null;
  private objectUrl: string | null = null;
  private loadedKey = '';

  constructor(
    private readonly pdfService: QuotationPdfService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && this.quotation && this.company) {
      void this.loadPreview();
    }
  }

  async loadPreview(): Promise<void> {
    const key = `${this.quotation.id ?? this.quotation.quotationNo}`;
    if (this.loadedKey === key && this.blob && this.safePdfUrl()) {
      if (this.autoPrint) this.schedulePrint();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.revokeUrl();

    try {
      this.blob = await this.pdfService.generatePdf(this.quotation, this.company);
      this.objectUrl = URL.createObjectURL(this.blob);
      this.safePdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
      this.loadedKey = key;
      if (this.autoPrint) this.schedulePrint();
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      this.loading.set(false);
    }
  }

  handleHide(): void {
    this.autoPrint = false;
    this.onClose.emit();
  }

  close(): void {
    this.visible = false;
    this.handleHide();
  }

  download(): void {
    if (!this.blob || !this.quotation) return;
    const url = URL.createObjectURL(this.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quotation-${this.quotation.quotationNo}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  print(): void {
    if (this.objectUrl) {
      const tab = window.open(this.objectUrl, '_blank');
      tab?.addEventListener('load', () => tab.print());
    }
  }

  private schedulePrint(): void {
    setTimeout(() => this.print(), 600);
  }

  private revokeUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.safePdfUrl.set(null);
    this.blob = null;
  }
}
