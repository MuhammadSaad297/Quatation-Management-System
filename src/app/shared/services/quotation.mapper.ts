import {
  CompanySettings,
  CompanySettingsRow,
  Quotation,
  QuotationItem,
  QuotationItemRow,
  QuotationRow,
} from '../models/quotation.model';
import { DEFAULT_COMPANY } from '../constants/company.defaults';

export function mapQuotationFromRow(row: QuotationRow, items: QuotationItemRow[] = []): Quotation {
  return {
    id: row.id,
    quotationNo: row.quotation_no,
    quotationDate: row.quotation_date,
    validUntil: row.valid_until,
    customerName: row.customer_name,
    attention: row.attention ?? '',
    companyName: row.company_name ?? '',
    contactNo: row.contact_no ?? '',
    email: row.email ?? '',
    projectName: row.project_name ?? '',
    phone: row.phone ?? '',
    preparedBy: row.prepared_by ?? '',
    preparedContactNo: row.prepared_contact_no ?? '',
    grandTotal: Number(row.grand_total),
    remarks: row.remarks ?? '',
    createdAt: row.created_at,
    items: items.map(mapItemFromRow),
  };
}

export function mapItemFromRow(row: QuotationItemRow): QuotationItem {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    srNo: row.sr_no,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
  };
}

export function mapQuotationToRow(quotation: Quotation): Omit<QuotationRow, 'id' | 'created_at'> {
  return {
    quotation_no: quotation.quotationNo,
    quotation_date: quotation.quotationDate,
    valid_until: quotation.validUntil,
    customer_name: quotation.customerName,
    attention: quotation.attention || null,
    company_name: quotation.companyName || null,
    contact_no: quotation.contactNo || null,
    email: quotation.email || null,
    project_name: quotation.projectName || null,
    phone: quotation.phone || null,
    prepared_by: quotation.preparedBy || null,
    prepared_contact_no: quotation.preparedContactNo || null,
    grand_total: quotation.grandTotal,
    remarks: quotation.remarks || null,
  };
}

export function mapItemToRow(
  item: QuotationItem,
  quotationId: string
): Omit<QuotationItemRow, 'id'> {
  return {
    quotation_id: quotationId,
    sr_no: item.srNo,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total: item.total,
  };
}

export function mapCompanySettingsFromRow(row: CompanySettingsRow): CompanySettings {
  return {
    id: row.id,
    companyName: row.company_name || DEFAULT_COMPANY.companyName,
    companyNameArabic: row.company_name_arabic ?? DEFAULT_COMPANY.companyNameArabic,
    addressLine1: row.address_line1 ?? DEFAULT_COMPANY.addressLine1,
    addressLine2: row.address_line2 ?? '',
    phone: row.phone ?? DEFAULT_COMPANY.phone,
    email: row.email ?? DEFAULT_COMPANY.email,
    website: row.website ?? '',
    logoUrl: row.logo_url ?? DEFAULT_COMPANY.logoUrl,
    logoBase64: row.logo_base64,
    documentTitle: row.document_title ?? DEFAULT_COMPANY.documentTitle,
    footerText: row.footer_text ?? DEFAULT_COMPANY.footerText,
    termsAndConditions: row.terms_and_conditions ?? DEFAULT_COMPANY.termsAndConditions,
  };
}

export function mapCompanySettingsToRow(
  settings: CompanySettings
): Omit<CompanySettingsRow, 'id'> {
  return {
    company_name: settings.companyName,
    company_name_arabic: settings.companyNameArabic || null,
    address_line1: settings.addressLine1 || null,
    address_line2: settings.addressLine2 || null,
    phone: settings.phone || null,
    email: settings.email || null,
    website: settings.website || null,
    logo_url: settings.logoUrl,
    logo_base64: settings.logoBase64,
    document_title: settings.documentTitle || null,
    footer_text: settings.footerText || null,
    terms_and_conditions: settings.termsAndConditions || null,
  };
}
