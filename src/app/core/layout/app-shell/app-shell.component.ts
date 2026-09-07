import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, BreadcrumbComponent],
  template: `
    <div class="shell" [class.shell--collapsed]="collapsed()">
      <header class="navbar">
        <button
          type="button"
          class="icon-button"
          (click)="toggleNavigation()"
          [attr.aria-label]="'navigation.toggle' | translate"
        >
          <span class="pi pi-bars"></span>
        </button>
        <a routerLink="/dashboard" class="brand"
          ><img src="/assets/brand/sharemoney-header.png" width="167" height="50" [alt]="'app.name' | translate"
        /></a>
        <div class="navbar__spacer"></div>
        <div class="language" [attr.aria-label]="'language.title' | translate">
          <button type="button" [class.active]="language() === 'th'" (click)="setLanguage('th')">TH</button><span></span
          ><button type="button" [class.active]="language() === 'en'" (click)="setLanguage('en')">EN</button>
        </div>
        <button
          type="button"
          class="user"
          (click)="userMenuOpen.set(!userMenuOpen())"
          [attr.aria-expanded]="userMenuOpen()"
        >
          <span class="avatar">{{ initials() }}</span
          ><span class="user__details"
            ><strong>{{ auth.currentUser()?.name }}</strong
            ><small>{{ auth.currentUser()?.role }}</small></span
          ><span class="pi pi-angle-down"></span>
        </button>
        @if (userMenuOpen()) {
          <div class="user-menu">
            <a routerLink="/profile" (click)="userMenuOpen.set(false)"
              ><span class="pi pi-user"></span>{{ 'profile.title' | translate }}</a
            >
            <a routerLink="/slips" (click)="userMenuOpen.set(false)"
              ><span class="pi pi-image"></span>{{ 'slips.title' | translate }}</a
            >
          </div>
        }
      </header>
      <aside class="sidebar" [class.sidebar--open]="mobileOpen()">
        <nav class="sidebar-primary" aria-label="Main navigation">
          @for (item of primaryMenuItems(); track item.id) {
            @if (item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                (click)="mobileOpen.set(false)"
                [title]="collapsed() ? (item.menuKey | translate) : ''"
                ><span class="pi" [class]="'pi ' + menuIcon(item.icon)"></span
                ><span class="menu-label">{{ item.menuKey | translate }}</span></a
              >
            } @else {
              <button
                type="button"
                class="menu-group"
                (click)="toggleMenuGroup(item.id)"
                [attr.aria-expanded]="isMenuGroupExpanded(item.id)"
              >
                <span class="pi" [class]="'pi ' + menuIcon(item.icon)"></span
                ><span class="menu-label">{{ item.menuKey | translate }}</span
                ><span
                  class="pi group-arrow"
                  [class.pi-angle-down]="isMenuGroupExpanded(item.id)"
                  [class.pi-angle-right]="!isMenuGroupExpanded(item.id)"
                ></span>
              </button>
              @if (isMenuGroupExpanded(item.id)) {
                <div class="submenu">
                  @for (child of item.children; track child.id) {
                    <a
                      class="menu-child"
                      [routerLink]="child.route"
                      routerLinkActive="active"
                      (click)="mobileOpen.set(false)"
                      ><span class="pi" [class]="'pi ' + menuIcon(child.icon)"></span
                      ><span class="menu-label">{{ child.menuKey | translate }}</span></a
                    >
                  }
                </div>
              }
            }
          } @empty {
            @for (row of [1, 2, 3, 4]; track row) {
              <div class="nav-skeleton"></div>
            }
          }
        </nav>
        <nav class="sidebar-admin" aria-label="Administration navigation">
          @for (item of adminMenuItems(); track item.id) {
            <button
              type="button"
              class="menu-group"
              (click)="toggleMenuGroup(item.id)"
              [attr.aria-expanded]="isMenuGroupExpanded(item.id)"
            >
              <span class="pi" [class]="'pi ' + menuIcon(item.icon)"></span
              ><span class="menu-label">{{ item.menuKey | translate }}</span
              ><span
                class="pi group-arrow"
                [class.pi-angle-down]="isMenuGroupExpanded(item.id)"
                [class.pi-angle-right]="!isMenuGroupExpanded(item.id)"
              ></span>
            </button>
            @if (isMenuGroupExpanded(item.id)) {
              <div class="submenu">
                @for (child of item.children; track child.id) {
                  <a
                    class="menu-child"
                    [routerLink]="child.route"
                    routerLinkActive="active"
                    (click)="mobileOpen.set(false)"
                    ><span class="pi" [class]="'pi ' + menuIcon(child.icon)"></span
                    ><span class="menu-label">{{ child.menuKey | translate }}</span></a
                  >
                }
              </div>
            }
          }
        </nav>
        <nav class="sidebar-secondary" aria-label="Account navigation">
          @for (item of secondaryMenuItems(); track item.id) {
            @if (item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                (click)="mobileOpen.set(false)"
                [title]="collapsed() ? (item.menuKey | translate) : ''"
                ><span class="pi" [class]="'pi ' + menuIcon(item.icon)"></span
                ><span class="menu-label">{{ item.menuKey | translate }}</span></a
              >
            } @else {
              <button
                type="button"
                class="menu-group"
                (click)="toggleMenuGroup(item.id)"
                [attr.aria-expanded]="isMenuGroupExpanded(item.id)"
              >
                <span class="pi" [class]="'pi ' + menuIcon(item.icon)"></span
                ><span class="menu-label">{{ item.menuKey | translate }}</span
                ><span
                  class="pi group-arrow"
                  [class.pi-angle-down]="isMenuGroupExpanded(item.id)"
                  [class.pi-angle-right]="!isMenuGroupExpanded(item.id)"
                ></span>
              </button>
              @if (isMenuGroupExpanded(item.id)) {
                <div class="submenu">
                  @for (child of item.children; track child.id) {
                    <a
                      class="menu-child"
                      [routerLink]="child.route"
                      routerLinkActive="active"
                      (click)="mobileOpen.set(false)"
                      ><span class="pi" [class]="'pi ' + menuIcon(child.icon)"></span
                      ><span class="menu-label">{{ child.menuKey | translate }}</span></a
                    >
                  }
                </div>
              }
            }
          }
          <div class="sidebar-meta">
            <button
              type="button"
              class="meta-logout"
              (click)="confirmLogout()"
              [attr.aria-label]="'auth.logout' | translate"
              [title]="collapsed() ? ('auth.logout' | translate) : ''"
            >
              <span class="pi pi-sign-out"></span><span class="menu-label">{{ 'auth.logout' | translate }}</span>
            </button>
            <span class="version-text">v1.0.0</span>
          </div>
        </nav>
      </aside>
      @if (mobileOpen()) {
        <button type="button" class="backdrop" (click)="mobileOpen.set(false)" aria-label="Close navigation"></button>
      }
      @if (loading.isLoading()) {
        <div class="progress"><span></span></div>
      }
      <main class="content">
        @if (breadcrumbItems().length > 0) {
          <app-breadcrumb class="mb-5 block w-full" [items]="breadcrumbItems()" />
        }
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly menu = inject(MenuService);
  readonly loading = inject(LoadingService);
  private readonly translate = inject(TranslateService);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly breadcrumbItems = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.buildBreadcrumbItems())
    ),
    { initialValue: [] as BreadcrumbItem[] }
  );
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly expandedMenuIds = signal<ReadonlySet<number>>(new Set());
  readonly language = signal<'th' | 'en'>(localStorage.getItem('lang') === 'en' ? 'en' : 'th');
  readonly initials = computed(() => this.auth.currentUser()?.name.trim().slice(0, 2).toUpperCase() ?? 'SM');
  readonly primaryMenuItems = computed(() =>
    this.menu
      .menuTree()
      .filter((item) => !this.isSecondaryMenu(item.menuKey) && item.menuKey !== 'menu.admin')
      .sort((first, second) => first.sortOrder - second.sortOrder)
  );
  readonly adminMenuItems = computed(() => this.menu.menuTree().filter((item) => item.menuKey === 'menu.admin'));
  readonly secondaryMenuItems = computed(() =>
    this.menu.menuTree().filter((item) => this.isSecondaryMenu(item.menuKey))
  );

  ngOnInit(): void {
    this.menu.loadMenu().subscribe();
  }
  async confirmLogout(): Promise<void> {
    const confirmed = await this.sweetAlert.confirm({
      titleKey: 'auth.logoutConfirmTitle',
      textKey: 'auth.logoutConfirmText',
      confirmButtonKey: 'auth.logout',
      cancelButtonKey: 'common.cancel'
    });
    if (confirmed) this.auth.logout();
  }
  toggleNavigation(): void {
    window.innerWidth < 1024 ? this.mobileOpen.update((value) => !value) : this.collapsed.update((value) => !value);
  }
  setLanguage(language: 'th' | 'en'): void {
    this.language.set(language);
    localStorage.setItem('lang', language);
    document.documentElement.lang = language;
    this.translate.use(language);
  }
  menuIcon(icon: string): string {
    const icons: Record<string, string> = {
      dashboard: 'pi-chart-pie',
      receipt_long: 'pi-receipt',
      group: 'pi-users',
      description: 'pi-file',
      summarize: 'pi-chart-bar',
      admin_panel_settings: 'pi-cog',
      list_alt: 'pi-list',
      tune: 'pi-sliders-h',
      history: 'pi-history',
      supervisor_account: 'pi-user-plus',
      person: 'pi-user'
    };
    return icons[icon] ?? (icon.startsWith('pi-') ? icon : 'pi-circle');
  }
  toggleMenuGroup(id: number): void {
    this.expandedMenuIds.update((current) => {
      const updated = new Set(current);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  }
  isMenuGroupExpanded(id: number): boolean {
    return this.expandedMenuIds().has(id);
  }
  private isSecondaryMenu(menuKey: string): boolean {
    return menuKey === 'menu.profile';
  }
  private buildBreadcrumbItems(): BreadcrumbItem[] {
    let deepestRoute = this.route.firstChild;
    while (deepestRoute?.firstChild) deepestRoute = deepestRoute.firstChild;
    const titleKey = deepestRoute?.snapshot?.data?.['titleKey'] as string | undefined;
    if (!titleKey || titleKey === 'menu.dashboard') return [];
    return [{ icon: 'pi-home', route: '/dashboard' }, { labelKey: titleKey }];
  }
}
