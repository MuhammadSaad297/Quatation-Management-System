import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  mapCompanySettingsFromRow,
  mapCompanySettingsToRow,
  mapItemFromRow,
  mapItemToRow,
  mapQuotationFromRow,
  mapQuotationToRow,
} from './quotation.mapper';
import { DEFAULT_COMPANY } from '../constants/company.defaults';
import {
  CompanySettings,
  CompanySettingsRow,
  Quotation,
  QuotationItemRow,
  QuotationRow,
} from '../models/quotation.model';

@Injectable({ providedIn: 'root' })
export class CompanySettingsService {
  readonly settings = signal<CompanySettings | null>(null);

  constructor(private readonly supabase: SupabaseService) {}

  async load(): Promise<CompanySettings> {
    const { data, error } = await this.supabase.db
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const settings = mapCompanySettingsFromRow(data as CompanySettingsRow);
    this.settings.set(settings);
    return settings;
  }

  async save(settings: CompanySettings): Promise<CompanySettings> {
    const row = mapCompanySettingsToRow(settings);
    const existing = this.settings()?.id;

    if (existing) {
      const { data, error } = await this.supabase.db
        .from('company_settings')
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', existing)
        .select()
        .single();

      if (error) throw new Error(error.message);
      const updated = mapCompanySettingsFromRow(data as CompanySettingsRow);
      this.settings.set(updated);
      return updated;
    }

    const { data, error } = await this.supabase.db
      .from('company_settings')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(error.message);
    const created = mapCompanySettingsFromRow(data as CompanySettingsRow);
    this.settings.set(created);
    return created;
  }

  async uploadLogo(file: File): Promise<string> {
    const base64 = await this.fileToBase64(file);
    let current = this.settings();
    if (!current) {
      current = {
        ...DEFAULT_COMPANY,
        logoBase64: null,
      };
    }
    await this.save({ ...current, logoBase64: base64, logoUrl: null });
    return base64;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

@Injectable({ providedIn: 'root' })
export class QuotationService {
  constructor(private readonly supabase: SupabaseService) {}

  async getNextQuotationNo(): Promise<number> {
    const { data, error } = await this.supabase.db.rpc('get_next_quotation_no');
    if (error) {
      const { data: rows, error: fetchError } = await this.supabase.db
        .from('quotations')
        .select('quotation_no')
        .order('quotation_no', { ascending: false })
        .limit(1);

      if (fetchError) throw new Error(fetchError.message);
      const max = rows?.[0]?.quotation_no ?? 43300;
      return max + 1;
    }
    return data as number;
  }

  async getAll(search?: string, page = 0, pageSize = 10): Promise<{ data: Quotation[]; total: number }> {
    let query = this.supabase.db
      .from('quotations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search?.trim()) {
      const term = search.trim();
      const num = parseInt(term, 10);
      const filters = [
        `customer_name.ilike.%${term}%`,
        `company_name.ilike.%${term}%`,
        `project_name.ilike.%${term}%`,
      ];
      if (!Number.isNaN(num)) {
        filters.push(`quotation_no.eq.${num}`);
      }
      query = query.or(filters.join(','));
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw new Error(error.message);

    return {
      data: (data as QuotationRow[]).map((row) => mapQuotationFromRow(row)),
      total: count ?? 0,
    };
  }

  async getById(id: string): Promise<Quotation> {
    const { data: quotation, error } = await this.supabase.db
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    const { data: items, error: itemsError } = await this.supabase.db
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', id)
      .order('sr_no', { ascending: true });

    if (itemsError) throw new Error(itemsError.message);

    return mapQuotationFromRow(quotation as QuotationRow, (items ?? []) as QuotationItemRow[]);
  }

  async save(quotation: Quotation): Promise<Quotation> {
    const row = mapQuotationToRow(quotation);

    if (quotation.id) {
      const { data, error } = await this.supabase.db
        .from('quotations')
        .update(row)
        .eq('id', quotation.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await this.supabase.db.from('quotation_items').delete().eq('quotation_id', quotation.id);

      const items = quotation.items ?? [];
      if (items.length) {
        const itemRows = items.map((item) => mapItemToRow(item, quotation.id!));
        const { error: itemsError } = await this.supabase.db.from('quotation_items').insert(itemRows);
        if (itemsError) throw new Error(itemsError.message);
      }

      return mapQuotationFromRow(data as QuotationRow, items.map((item, i) => ({
        id: item.id ?? '',
        quotation_id: quotation.id!,
        sr_no: item.srNo,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      })));
    }

    const { data, error } = await this.supabase.db
      .from('quotations')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const saved = data as QuotationRow;
    const items = quotation.items ?? [];

    if (items.length) {
      const itemRows = items.map((item) => mapItemToRow(item, saved.id));
      const { error: itemsError } = await this.supabase.db.from('quotation_items').insert(itemRows);
      if (itemsError) throw new Error(itemsError.message);
    }

    return this.getById(saved.id);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.db.from('quotations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async duplicate(id: string): Promise<Quotation> {
    const original = await this.getById(id);
    const nextNo = await this.getNextQuotationNo();
    const today = new Date().toISOString().split('T')[0];

    const duplicate: Quotation = {
      ...original,
      id: undefined,
      quotationNo: nextNo,
      quotationDate: today,
      validUntil: null,
      createdAt: undefined,
      items: (original.items ?? []).map((item) => ({
        ...item,
        id: undefined,
        quotationId: undefined,
      })),
    };

    return this.save(duplicate);
  }
}
