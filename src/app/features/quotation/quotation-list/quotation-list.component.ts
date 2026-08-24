import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { QuotationService, CompanySettingsService } from '../../../shared/services/quotation.service';
import { CompanySettings, Quotation } from '../../../shared/models/quotation.model';
import { DEFAULT_COMPANY } from '../../../shared/constants/company.defaults';
import { QuotationPdfPreviewComponent } from '../quotation-pdf/quotation-pdf-preview.component';
import { QuotationPdfService } from '../quotation-pdf/quotation-pdf.service';

@Component({
  selector: 'app-quotation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    TooltipModule,
    ProgressSpinnerModule,
    QuotationPdfPreviewComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './quotation-list.component.html',
  styleUrl: './quotation-list.component.scss',
})
export class QuotationListComponent implements OnInit {
  readonly quotations = signal<Quotation[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly pdfLoading = signal(false);
  readonly pdfDownloadingId = signal<string | null>(null);
  searchTerm = '';
  pdfPreviewVisible = false;
  pdfAutoPrint = false;
  readonly pdfQuotation = signal<Quotation | null>(null);
  readonly pdfCompany = signal<CompanySettings>({ ...DEFAULT_COMPANY, logoBase64: null });

  page = 0;
  pageSize = 10;

  constructor(
    private readonly quotationService: QuotationService,
    readonly companyService: CompanySettingsService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
    private readonly router: Router,
    private readonly pdfService: QuotationPdfService
  ) {}

  private loadRequestId = 0;

  ngOnInit(): void {
    void this.companyService.load().catch(() => undefined);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url === '/quotations' || this.router.url === '/') {
          this.refreshList();
        }
      });
  }

  async loadQuotations(): Promise<void> {
    const requestId = ++this.loadRequestId;
    this.loading.set(true);
    try {
      const result = await this.quotationService.getAll(
        this.searchTerm,
        this.page,
        this.pageSize
      );
      if (requestId !== this.loadRequestId) return;
      this.quotations.set(result.data);
      this.totalRecords.set(result.total);
    } catch (err) {
      if (requestId !== this.loadRequestId) return;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to load quotations',
      });
    } finally {
      if (requestId === this.loadRequestId) {
        this.loading.set(false);
      }
    }
  }

  onSearch(): void {
    this.page = 0;
    this.loadRequestId++;
    void this.loadQuotations();
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const nextPage = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize));
    const nextPageSize = event.rows ?? this.pageSize;
    this.page = nextPage;
    this.pageSize = nextPageSize;
    void this.loadQuotations();
  }

  refreshList(): void {
    this.loadRequestId++;
    void this.loadQuotations();
  }

  createNew(): void {
    void this.router.navigate(['/quotations/new']);
  }

  edit(id: string): void {
    void this.router.navigate(['/quotations', id, 'edit']);
  }

  async duplicate(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const duplicate = await this.quotationService.duplicate(id);
      this.messageService.add({
        severity: 'success',
        summary: 'Duplicated',
        detail: `Quotation ${duplicate.quotationNo} created`,
      });
      void this.loadQuotations();
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to duplicate',
      });
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete(quotation: Quotation): void {
    this.confirmationService.confirm({
      message: `Delete quotation #${quotation.quotationNo}?`,
      header: 'Confirm Delete',
      icon: 'bi bi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.delete(quotation.id!),
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await this.quotationService.delete(id);
      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Quotation deleted successfully',
      });
      void this.loadQuotations();
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to delete',
      });
    }
  }

  async printPdf(quotation: Quotation): Promise<void> {
    await this.openPdfPreview(quotation, true);
  }

  async previewPdf(quotation: Quotation): Promise<void> {
    await this.openPdfPreview(quotation, false);
  }

  async downloadPdf(quotation: Quotation): Promise<void> {
    if (!quotation.id) return;

    this.pdfDownloadingId.set(quotation.id);
    try {
      const full = await this.quotationService.getById(quotation.id);
      const company =
        this.companyService.settings() ??
        (await this.companyService.load().catch(() => ({ ...DEFAULT_COMPANY, logoBase64: null })));

      await this.pdfService.downloadPdf(full, company);
      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded',
        detail: `Quotation-${full.quotationNo}.pdf saved`,
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to download PDF',
      });
    } finally {
      this.pdfDownloadingId.set(null);
    }
  }

  private async openPdfPreview(quotation: Quotation, autoPrint: boolean): Promise<void> {
    this.pdfLoading.set(true);
    try {
      const full = await this.quotationService.getById(quotation.id!);

      const company =
        this.companyService.settings() ??
        (await this.companyService.load().catch(() => ({ ...DEFAULT_COMPANY, logoBase64: null })));

      this.pdfCompany.set(company);
      this.pdfQuotation.set(full);
      this.pdfAutoPrint = autoPrint;
      this.pdfPreviewVisible = true;
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to generate PDF',
      });
    } finally {
      this.pdfLoading.set(false);
    }
  }

  closePdfPreview(): void {
    this.pdfPreviewVisible = false;
    this.pdfAutoPrint = false;
    this.pdfQuotation.set(null);
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
