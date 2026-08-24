import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { QuotationService, CompanySettingsService } from '../../../shared/services/quotation.service';
import { Quotation, QuotationItem, CompanySettings } from '../../../shared/models/quotation.model';
import { QuotationPdfPreviewComponent } from '../quotation-pdf/quotation-pdf-preview.component';
import { QuotationPdfService } from '../quotation-pdf/quotation-pdf.service';
import { DEFAULT_COMPANY } from '../../../shared/constants/company.defaults';

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DatePickerModule,
    ToastModule,
    CardModule,
    DividerModule,
    TableModule,
    DialogModule,
    ProgressSpinnerModule,
    QuotationPdfPreviewComponent,
  ],
  templateUrl: './quotation-form.component.html',
  styleUrl: './quotation-form.component.scss',
})
export class QuotationFormComponent implements OnInit {
  form!: FormGroup;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly isEditMode = signal(false);
  readonly quotationId = signal<string | null>(null);
  settingsDialogVisible = false;
  pdfPreviewVisible = false;
  pdfAutoPrint = false;
  readonly pdfDownloading = signal(false);
  readonly savedQuotation = signal<Quotation | null>(null);
  readonly companySettings = signal<CompanySettings | null>(null);

  settingsForm!: FormGroup;

  get grandTotal(): number {
    return this.items.controls.reduce((sum, ctrl) => {
      const total = ctrl.get('total')?.value ?? 0;
      return sum + Number(total);
    }, 0);
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly quotationService: QuotationService,
    readonly companyService: CompanySettingsService,
    private readonly messageService: MessageService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pdfService: QuotationPdfService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initSettingsForm();
    void this.loadInitialData();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  private initForm(): void {
    const today = new Date();
    this.form = this.fb.group({
      quotationNo: [{ value: 0, disabled: true }],
      quotationDate: [today, Validators.required],
      validUntil: [null],
      customerName: ['', Validators.required],
      attention: [''],
      companyName: [''],
      contactNo: [''],
      email: ['', Validators.email],
      projectName: [''],
      phone: [''],
      preparedBy: [''],
      preparedContactNo: [''],
      remarks: [''],
      items: this.fb.array([this.createItemRow(1)]),
    });

    this.form.get('items')!.valueChanges.subscribe(() => this.updateGrandTotalControl());
  }

  private initSettingsForm(): void {
    this.settingsForm = this.fb.group({
      companyName: ['', Validators.required],
      companyNameArabic: [''],
      addressLine1: [''],
      addressLine2: [''],
      phone: [''],
      email: [''],
      website: [''],
      documentTitle: ['CONTRACT'],
      footerText: [''],
      termsAndConditions: [''],
    });
  }

  private async loadInitialData(): Promise<void> {
    this.loading.set(true);
    try {
      try {
        const settings = await this.companyService.load();
        this.companySettings.set(settings);
        this.settingsForm.patchValue(settings);
      } catch {
        const defaults: CompanySettings = {
          ...DEFAULT_COMPANY,
          logoBase64: null,
        };
        this.companySettings.set(defaults);
        this.settingsForm.patchValue(defaults);
      }

      const id = this.route.snapshot.paramMap.get('id');
      const isEdit = this.route.snapshot.url.some((s) => s.path === 'edit');

      if (id && isEdit) {
        this.isEditMode.set(true);
        this.quotationId.set(id);
        const quotation = await this.quotationService.getById(id);
        this.patchForm(quotation);
        this.saved.set(true);
        this.savedQuotation.set(quotation);
      } else {
        const nextNo = await this.quotationService.getNextQuotationNo();
        this.form.patchValue({ quotationNo: nextNo });
      }
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to load data',
      });
    } finally {
      this.loading.set(false);
    }
  }

  private patchForm(quotation: Quotation): void {
    this.form.patchValue({
      quotationNo: quotation.quotationNo,
      quotationDate: new Date(quotation.quotationDate + 'T00:00:00'),
      validUntil: quotation.validUntil
        ? new Date(quotation.validUntil + 'T00:00:00')
        : null,
      customerName: quotation.customerName,
      attention: quotation.attention,
      companyName: quotation.companyName,
      contactNo: quotation.contactNo,
      email: quotation.email,
      projectName: quotation.projectName,
      phone: quotation.phone,
      preparedBy: quotation.preparedBy,
      preparedContactNo: quotation.preparedContactNo,
      remarks: quotation.remarks,
    });

    this.items.clear();
    (quotation.items ?? []).forEach((item) => {
      this.items.push(this.createItemRow(item.srNo, item));
    });
    if (!this.items.length) {
      this.items.push(this.createItemRow(1));
    }
  }

  private createItemRow(srNo: number, item?: QuotationItem): FormGroup {
    const group = this.fb.group({
      srNo: [srNo],
      description: [item?.description ?? '', Validators.required],
      quantity: [item?.quantity ?? 1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [item?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
      total: [{ value: item?.total ?? 0, disabled: true }],
    });

    group.get('quantity')!.valueChanges.subscribe(() => this.calculateRowTotal(group));
    group.get('unitPrice')!.valueChanges.subscribe(() => this.calculateRowTotal(group));

    if (!item) {
      this.calculateRowTotal(group);
    }

    return group;
  }

  private calculateRowTotal(group: FormGroup): void {
    const qty = Number(group.get('quantity')?.value ?? 0);
    const price = Number(group.get('unitPrice')?.value ?? 0);
    const total = Math.round(qty * price * 100) / 100;
    group.get('total')?.setValue(total, { emitEvent: false });
    this.updateGrandTotalControl();
  }

  private updateGrandTotalControl(): void {
    // Trigger computed signal refresh via form touch
  }

  addRow(): void {
    const nextSr = this.items.length + 1;
    this.items.push(this.createItemRow(nextSr));
    this.reindexRows();
  }

  removeRow(index: number): void {
    if (this.items.length <= 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'At least one item is required',
      });
      return;
    }
    this.items.removeAt(index);
    this.reindexRows();
  }

  private reindexRows(): void {
    this.items.controls.forEach((ctrl, i) => {
      ctrl.get('srNo')?.setValue(i + 1, { emitEvent: false });
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all required fields',
      });
      return;
    }

    this.saving.set(true);
    try {
      const quotation = this.buildQuotationPayload();
      const saved = await this.quotationService.save(quotation);
      this.saved.set(true);
      this.savedQuotation.set(saved);
      this.quotationId.set(saved.id ?? null);
      this.isEditMode.set(true);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Quotation Saved Successfully',
      });

      if (!this.route.snapshot.paramMap.get('id')) {
        void this.router.navigate(['/quotations', saved.id, 'edit'], { replaceUrl: true });
      }
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to save quotation',
      });
    } finally {
      this.saving.set(false);
    }
  }

  private buildQuotationPayload(): Quotation {
    const raw = this.form.getRawValue();
    const items: QuotationItem[] = raw.items.map(
      (item: QuotationItem, index: number) => ({
        srNo: index + 1,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Math.round(Number(item.quantity) * Number(item.unitPrice) * 100) / 100,
      })
    );

    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    return {
      id: this.quotationId() ?? undefined,
      quotationNo: raw.quotationNo,
      quotationDate: this.toDateString(raw.quotationDate),
      validUntil: raw.validUntil ? this.toDateString(raw.validUntil) : null,
      customerName: raw.customerName,
      attention: raw.attention ?? '',
      companyName: raw.companyName ?? '',
      contactNo: raw.contactNo ?? '',
      email: raw.email ?? '',
      projectName: raw.projectName ?? '',
      phone: raw.phone ?? '',
      preparedBy: raw.preparedBy ?? '',
      preparedContactNo: raw.preparedContactNo ?? '',
      grandTotal,
      remarks: raw.remarks ?? '',
      items,
    };
  }

  private toDateString(value: Date): string {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  goBack(): void {
    void this.router.navigate(['/quotations']);
  }

  openSettings(): void {
    const settings = this.companyService.settings();
    if (settings) {
      this.settingsForm.patchValue(settings);
    }
    this.settingsDialogVisible = true;
  }

  async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid) return;
    try {
      const updated = await this.companyService.save({
        ...this.companyService.settings()!,
        ...this.settingsForm.value,
      });
      this.companySettings.set(updated);
      this.settingsDialogVisible = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Company settings updated',
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to save settings',
      });
    }
  }

  async onLogoSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await this.companyService.uploadLogo(file);
      const settings = this.companyService.settings();
      this.companySettings.set(settings);
      this.messageService.add({
        severity: 'success',
        summary: 'Logo Updated',
        detail: 'PDF will use the new logo',
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to upload logo',
      });
    } finally {
      input.value = '';
    }
  }

  async printPdf(): Promise<void> {
    const quotation = this.savedQuotation();
    const company = this.companySettings();
    if (!quotation || !company) return;
    this.pdfAutoPrint = true;
    this.pdfPreviewVisible = true;
  }

  previewPdf(): void {
    this.pdfAutoPrint = false;
    this.pdfPreviewVisible = true;
  }

  async downloadPdf(): Promise<void> {
    const quotation = this.savedQuotation();
    const company = this.companySettings();
    if (!quotation || !company) return;

    this.pdfDownloading.set(true);
    try {
      await this.pdfService.downloadPdf(quotation, company);
      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded',
        detail: `Quotation-${quotation.quotationNo}.pdf saved`,
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err instanceof Error ? err.message : 'Failed to download PDF',
      });
    } finally {
      this.pdfDownloading.set(false);
    }
  }

  closePdfPreview(): void {
    this.pdfPreviewVisible = false;
    this.pdfAutoPrint = false;
  }

  isInvalid(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
