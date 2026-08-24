import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      { path: '', redirectTo: 'quotations', pathMatch: 'full' },
      {
        path: 'quotations',
        loadComponent: () =>
          import('./features/quotation/quotation-list/quotation-list.component').then(
            (m) => m.QuotationListComponent
          ),
      },
      {
        path: 'quotations/new',
        loadComponent: () =>
          import('./features/quotation/quotation-form/quotation-form.component').then(
            (m) => m.QuotationFormComponent
          ),
      },
      {
        path: 'quotations/:id/edit',
        loadComponent: () =>
          import('./features/quotation/quotation-form/quotation-form.component').then(
            (m) => m.QuotationFormComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'quotations' },
];
