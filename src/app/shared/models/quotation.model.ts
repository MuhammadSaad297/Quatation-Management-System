export interface QuotationItem {
  id?: string;
  quotationId?: string;
  srNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quotation {
  id?: string;
  quotationNo: number;
  quotationDate: string;
  validUntil: string | null;
  customerName: string;
  attention: string;
  companyName: string;
  contactNo: string;
  email: string;
  projectName: string;
  phone: string;
  preparedBy: string;
  preparedContactNo: string;
  grandTotal: number;
  remarks: string;
  createdAt?: string;
  items?: QuotationItem[];
}

export interface QuotationRow {
  id: string;
  quotation_no: number;
  quotation_date: string;
  valid_until: string | null;
  customer_name: string;
  attention: string | null;
  company_name: string | null;
  contact_no: string | null;
  email: string | null;
  project_name: string | null;
  phone: string | null;
  prepared_by: string | null;
  prepared_contact_no: string | null;
  grand_total: number;
  remarks: string | null;
  created_at: string;
}

export interface QuotationItemRow {
  id: string;
  quotation_id: string;
  sr_no: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CompanySettings {
  id?: string;
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string | null;
  logoBase64: string | null;
  companyNameArabic: string;
  documentTitle: string;
  footerText: string;
  termsAndConditions: string;
}

export interface CompanySettingsRow {
  id: string;
  company_name: string;
  address_line1: string | null;
  address_line2: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  logo_base64: string | null;
  company_name_arabic: string | null;
  document_title: string | null;
  footer_text: string | null;
  terms_and_conditions: string | null;
}
