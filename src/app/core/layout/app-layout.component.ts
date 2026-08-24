import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, ToastModule],
  template: `
    <div class="app-shell">
      <nav class="app-nav">
        <a routerLink="/quotations" class="brand">
          <i class="bi bi-file-earmark-richtext"></i>
          <span>Quotation Manager</span>
        </a>
        <div class="nav-links">
          <a routerLink="/quotations" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <i class="bi bi-grid"></i> Dashboard
          </a>
          <a routerLink="/quotations/new" routerLinkActive="active">
            <i class="bi bi-plus-circle"></i> New Quotation
          </a>
        </div>
      </nav>
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .app-shell {
      min-height: 100vh;
      background: var(--surface-ground);
    }

    .app-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: var(--primary-color);
      font-weight: 700;
      font-size: 1.1rem;

      i {
        font-size: 1.4rem;
      }
    }

    .nav-links {
      display: flex;
      gap: 0.5rem;

      a {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        color: var(--text-color-secondary);
        font-size: 0.9rem;
        transition: all 0.2s;

        &:hover,
        &.active {
          background: var(--primary-50, rgba(59, 130, 246, 0.1));
          color: var(--primary-color);
        }
      }
    }

    .app-main {
      padding: 1.5rem;
    }

    @media (max-width: 640px) {
      .app-nav {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .nav-links {
        width: 100%;
        overflow-x: auto;
      }

      .app-main {
        padding: 1rem;
      }
    }
  `,
})
export class AppLayoutComponent {}
