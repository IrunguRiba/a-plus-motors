import {
  Component,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  Renderer2
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import gsap from 'gsap';

import { ApiServices } from '../../services/api-services';
import { StoreCar } from '../../interfaces/car-interface';
import { SafeVideoUrlPipe } from '../portfolio/specs/safe-url.pipe';
import { Footer } from '../footer/footer';
import { Nav } from '../nav/nav';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, SafeVideoUrlPipe, Footer, Nav],
  templateUrl: './store.html',
  styleUrl: './store.css'
})
export class Store implements AfterViewInit, OnDestroy {
  // ------------------------------------------------------------------
  // View refs
  // ------------------------------------------------------------------
  @ViewChild('smoothContent', { static: true }) smoothContent!: ElementRef;
  /** The `.store` block — used to decide when the car grid is the active
   *  scroll context. NOT a sentinel; this is the real element. */
  @ViewChild('storeBlock', { static: true }) storeBlock!: ElementRef<HTMLElement>;
  /** The `.footer-wrapper` — any overlap with it forces the filter bar off. */
  @ViewChild('footerBlock', { static: true }) footerBlock!: ElementRef<HTMLElement>;

  // ------------------------------------------------------------------
  // Internal lifecycle
  // ------------------------------------------------------------------
  private ctx!: gsap.Context;
  private destroyed = false;
  private carsSub?: Subscription;

  private storeObserver?: IntersectionObserver;
  private footerObserver?: IntersectionObserver;

  /** Latest "is the car grid on screen" reading. */
  private storeInView = false;
  /** Latest "is the footer on screen" reading. */
  private footerInView = false;

  /** Bound to `[class.is-visible]` on `.main-nav-wrapper`. */
  filterNavVisible = false;

  /** Throttle timestamp for the scroll-driven fallback sync. */
  private lastScrollSync = 0;

  // ------------------------------------------------------------------
  // Persistence keys
  // ------------------------------------------------------------------
  private readonly LIKED_KEY = 'aplus.store.liked';
  private readonly SAVED_KEY = 'aplus.store.saved';

  /** Base URL of the API/media server for relative video paths. */
  private static readonly MEDIA_BASE = 'http://localhost:4000';

  // ------------------------------------------------------------------
  // Main nav state (bound to <app-nav>)
  // ------------------------------------------------------------------
  searchWindowOpened = false;
  isMenuOpen = false;
  logoImg = 'assets/logo.png'; // adjust to your real logo path

  // ------------------------------------------------------------------
  // Car list state
  // ------------------------------------------------------------------
  private allCars: StoreCar[] = [];
  cars: StoreCar[] = [];

  loading = true;
  error = '';

  readonly pageSize = 12;
  page = 1;
  totalPages = 1;

  liked = new Set<string>();
  saved = new Set<string>();
  copiedId: string | null = null;

  activeFilterDropdown: 'brand' | 'year' | null = null;
  selectedBrandFilter: string = '';
  selectedYearFilter: string = '';

  brands: string[] = [];
  years: string[] = [];

  activeView: 'all' | 'favorites' = 'all';

  hoveredCarId: string | null = null;
  supportsHover = true;

  /** Cars whose review video failed to load — fall back to image only. */
  private previewFailed = new Set<string>();

  constructor(
    private router: Router,
    private location: Location,
    private api: ApiServices,
    private renderer: Renderer2
  ) {
    this.liked = this.load(this.LIKED_KEY);
    this.saved = this.load(this.SAVED_KEY);
    this.fetchCars();
  }

  trackById(_: number, car: StoreCar): string {
    return car.id;
  }

  // ------------------------------------------------------------------
  // Data
  // ------------------------------------------------------------------
  fetchCars(): void {
    this.loading = true;
    this.error = '';
    this.carsSub?.unsubscribe();
    this.carsSub = this.api.getStoreCars().subscribe({
      next: list => {
        this.allCars = list;
        this.brands = Array.from(new Set(list.map(c => c.make))).sort();
        this.years = Array.from(new Set(list.map(c => c.year))).sort((a, b) => +b - +a);
        this.loading = false;
        this.refresh();
        // The grid just grew — re-evaluate visibility so the bar shows
        // immediately if the user is already scrolled into the grid.
        this.syncVisibilityFromLayout();
      },
      error: () => {
        this.loading = false;
        this.error = 'We could not load the cars right now. Please try again.';
      }
    });
  }

  private load(key: string): Set<string> {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[];
      return new Set<string>(parsed.map(String));
    } catch {
      return new Set<string>();
    }
  }

  private persist(key: string, set: Set<string>): void {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch { }
  }

  private refresh(animate = true): void {
    const list = this.allCars.filter(c =>
      (this.activeView === 'all' || this.saved.has(c.id)) &&
      (!this.selectedBrandFilter || c.make === this.selectedBrandFilter) &&
      (!this.selectedYearFilter || c.year === this.selectedYearFilter)
    );
    this.totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    this.page = Math.min(Math.max(1, this.page), this.totalPages);
    const start = (this.page - 1) * this.pageSize;
    this.cars = list.slice(start, start + this.pageSize);
    this.hoveredCarId = null;
    if (animate) this.animateCards();
  }

  private animateCards(): void {
    setTimeout(() => {
      if (this.destroyed || !this.ctx) return;
      this.ctx.add(() => {
        gsap.fromTo('.car-card',
          { opacity: 0, x: -60, scale: 0.85 },
          {
            opacity: 1, x: 0, scale: 1,
            duration: 0.35, ease: 'power2.out',
            stagger: 0.04, clearProps: 'opacity,transform'
          }
        );
      });
    }, 0);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ------------------------------------------------------------------
  // Main nav handlers
  // ------------------------------------------------------------------
  openSearch(): void {
    this.searchWindowOpened = true;
  }

  closeSearch(event?: Event): void {
    event?.stopPropagation();
    this.searchWindowOpened = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // ------------------------------------------------------------------
  // Filters / view
  // ------------------------------------------------------------------
  setActiveView(view: 'all' | 'favorites', event?: Event): void {
    event?.stopPropagation();
    this.activeView = view;
    this.activeFilterDropdown = null;
    if (view === 'all') {
      this.selectedBrandFilter = '';
      this.selectedYearFilter = '';
    }
    this.page = 1;
    this.refresh();
  }

  toggleFilterDropdown(type: 'brand' | 'year', event: Event): void {
    event.stopPropagation();
    this.activeFilterDropdown = this.activeFilterDropdown === type ? null : type;
  }

  selectFilterOption(type: 'brand' | 'year', value: string, event: Event): void {
    event.stopPropagation();
    if (type === 'brand') this.selectedBrandFilter = value;
    if (type === 'year') this.selectedYearFilter = value;
    this.activeFilterDropdown = null;
    this.page = 1;
    this.refresh();
  }

  closeFilterDropdown(): void {
    this.activeFilterDropdown = null;
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.refresh();
    this.scrollToTop();
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page--;
    this.refresh();
    this.scrollToTop();
  }

  toggleLike(car: StoreCar, event: Event): void {
    event.stopPropagation();
    this.liked.has(car.id) ? this.liked.delete(car.id) : this.liked.add(car.id);
    this.persist(this.LIKED_KEY, this.liked);
  }

  toggleSave(car: StoreCar, event: Event): void {
    event.stopPropagation();
    this.saved.has(car.id) ? this.saved.delete(car.id) : this.saved.add(car.id);
    this.persist(this.SAVED_KEY, this.saved);
    if (this.activeView === 'favorites') this.refresh(false);
  }

  private carUrl(car: StoreCar): string {
    const tree = this.router.createUrlTree(['/specs'], { queryParams: { id: car.id } });
    return window.location.origin + this.location.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  async shareCar(car: StoreCar, event: Event): Promise<void> {
    event.stopPropagation();
    const url = this.carUrl(car);
    const title = `${car.year} ${car.make} ${car.name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} · ${car.price} — A Plus Motors`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.copiedId = car.id;
      setTimeout(() => {
        if (this.copiedId === car.id) this.copiedId = null;
      }, 2000);
    } catch { }
  }

  // ------------------------------------------------------------------
  // Hover preview (video / iframe)
  // ------------------------------------------------------------------
  private normalize(raw?: string | null): string | null {
    const u = (raw ?? '').toString().trim();
    if (!u) return null;
    if (u.startsWith('//')) return 'https:' + u;
    if (/^https?:\/\//i.test(u)) return u;
    return Store.MEDIA_BASE.replace(/\/+$/, '') + '/' + u.replace(/^\/+/, '');
  }

  private embedFor(u: string): string | null {
    const yt = u.match(
      /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i
    );
    if (yt) {
      return `https://www.youtube-nocookie.com/embed/${yt[1]}` +
        `?rel=0&autoplay=1&mute=1&loop=1&playlist=${yt[1]}&playsinline=1&controls=0&modestbranding=1`;
    }
    const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1&background=1`;
    const sm = u.match(/streamable\.com\/(?:e\/)?([a-z0-9]+)/i);
    if (sm) return `https://streamable.com/e/${sm[1]}?autoplay=1&muted=1&loop=1`;
    return null;
  }

  private fileUrl(car: StoreCar): string | null {
    const u = this.normalize(car.reviewVideoUrl);
    if (!u || this.embedFor(u)) return null;
    return u;
  }

  private embedUrl(car: StoreCar): string | null {
    const u = this.normalize(car.reviewVideoUrl);
    return u ? this.embedFor(u) : null;
  }

  previewFileUrl(car: StoreCar): string | null { return this.fileUrl(car); }
  previewEmbedUrl(car: StoreCar): string | null { return this.embedUrl(car); }

  hasPreview(car: StoreCar): boolean {
    if (this.previewFailed.has(car.id)) return false;
    return !!this.fileUrl(car) || !!this.embedUrl(car);
  }

  onCardEnter(car: StoreCar): void {
    if (!this.supportsHover) return;
    if (!this.hasPreview(car)) return;
    this.hoveredCarId = car.id;
  }

  onCardLeave(car: StoreCar): void {
    if (this.hoveredCarId === car.id) this.hoveredCarId = null;
  }

  onPreviewError(car: StoreCar): void {
    this.previewFailed.add(car.id);
    if (this.hoveredCarId === car.id) this.hoveredCarId = null;
  }

  onPreviewCanPlay(el: HTMLVideoElement): void {
    el.muted = true;
    el.defaultMuted = true;
    if (el.paused) el.play().catch(() => { });
  }

  onPreviewReady(el: HTMLElement): void {
    el.classList.add('ready');
  }

  // ==================================================================
  // FILTER NAV VISIBILITY
  //
  // Rule: show the filter bar  <=>  car grid has scrolled past the
  //                                 top of the viewport
  //                             AND footer is NOT on screen.
  //
  // - Load at top:        grid top >= 0   -> hidden
  // - Scroll into grid:   grid top < 0, footer out of view -> shown
  // - Reach the footer:   footer in view  -> hidden
  // - Scroll past footer: grid bottom <= 0 -> hidden
  // - Scroll back up:     symmetric
  //
  // Both IntersectionObserver (for smooth edge detection while
  // scrolling) and a throttled geometry read (for instant correct
  // state on mount and on content-size changes) drive the same
  // `applyFilterNavVisibility()` decision. They cannot get out of
  // sync because they use the same rule.
  // ==================================================================

  private setupFilterNavVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') {
      // Very old browser — just show it.
      this.filterNavVisible = true;
      return;
    }

    // ---- Store block observer ----
    // `.store` is the whole car grid area. We don't use a sentinel here
    // because we need the grid's actual top/bottom edges to tell when
    // it has scrolled *past* the top vs when it's still in view.
    this.storeObserver = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          // "grid past top" means the block's top is above the viewport
          // and its bottom is below the viewport top — i.e. still on
          // screen but scrolled into.
          this.storeInView = e.isIntersecting;
          // Re-derive from geometry too, because `isIntersecting` can
          // be true while the block is still fully above the fold.
        }
        this.syncVisibilityFromLayout();
      },
      { rootMargin: '0px', threshold: 0 }
    );
    this.storeObserver.observe(this.storeBlock.nativeElement);

    // ---- Footer observer ----
    // Any overlap with the footer forces the bar off.
    this.footerObserver = new IntersectionObserver(
      entries => {
        for (const e of entries) this.footerInView = e.isIntersecting;
        this.applyFilterNavVisibility();
      },
      { rootMargin: '0px', threshold: 0 }
    );
    this.footerObserver.observe(this.footerBlock.nativeElement);

    // ---- Synchronous initial read ----
    // IntersectionObserver callbacks are async, so we can't rely on
    // them to set the correct initial state. Read real geometry now.
    this.syncVisibilityFromLayout();
  }

  /**
   * Reads real geometry and applies the visibility rule immediately.
   * Called on mount, on every throttled scroll/resize frame, and after
   * the car list grows so the bar responds without waiting for the
   * next IntersectionObserver tick.
   */
  private syncVisibilityFromLayout(): void {
    if (!this.storeBlock || !this.footerBlock) return;

    const vh = window.innerHeight || document.documentElement.clientHeight;
    const s = this.storeBlock.nativeElement.getBoundingClientRect();
    const f = this.footerBlock.nativeElement.getBoundingClientRect();

    // Grid counts as "the current scroll context" only once its top
    // has gone above the viewport top AND it still has content below.
    this.storeInView = s.top < 0 && s.bottom > 0;

    // Footer is "on screen" if any part of it overlaps the viewport.
    this.footerInView = f.bottom > 0 && f.top < vh;

    this.applyFilterNavVisibility();
  }

  /** Single decision point — no other place writes `filterNavVisible`. */
  private applyFilterNavVisibility(): void {
    const next = this.storeInView && !this.footerInView;
    if (next === this.filterNavVisible) return;
    this.filterNavVisible = next;
    // Close any open dropdown if the bar disappears.
    if (!next) this.activeFilterDropdown = null;
  }

  /** Throttled scroll/resize handler — cheap, ~12 fps. */
  private onScrollSync = (): void => {
    const now = performance.now();
    if (now - this.lastScrollSync < 80) return;
    this.lastScrollSync = now;
    this.syncVisibilityFromLayout();
  };

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------
  ngAfterViewInit(): void {
    this.supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Set up visibility observers + initial synchronous read.
    this.setupFilterNavVisibility();

    // Backup: keep visibility in sync while scrolling. Observers can be
    // laggy on first paint and while the grid resizes after API load.
    window.addEventListener('scroll', this.onScrollSync, { passive: true });
    window.addEventListener('resize', this.onScrollSync, { passive: true });

    // Initial card entrance animation.
    this.ctx = gsap.context(() => {
      if (!this.smoothContent.nativeElement.querySelector('.car-card')) return;
      gsap.from('.car-card', {
        opacity: 0,
        x: -60,
        scale: 0.85,
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.04,
        clearProps: 'opacity,transform'
      });
    }, this.smoothContent.nativeElement);

    // Dropdown dismiss + scroll listener (existing behavior).
    document.addEventListener('click', this.onDocumentClick, true);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    document.addEventListener('wheel', this.onScroll, { passive: true });
    document.addEventListener('touchmove', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.carsSub?.unsubscribe();
    this.ctx?.revert();
    this.storeObserver?.disconnect();
    this.footerObserver?.disconnect();
    window.removeEventListener('scroll', this.onScrollSync);
    window.removeEventListener('resize', this.onScrollSync);
    document.removeEventListener('click', this.onDocumentClick, true);
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('wheel', this.onScroll);
    document.removeEventListener('touchmove', this.onScroll);
  }

  // ------------------------------------------------------------------
  // Dropdown dismiss
  // ------------------------------------------------------------------
  private onDocumentClick = (event: MouseEvent): void => {
    if (this.activeFilterDropdown === null) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.filter-dropdown-portal')) return;
    if (target.closest('.filter-item.dropdown')) return;
    if (target.closest('.filter-item.center')) return;
    this.closeFilterDropdown();
  };

  private onScroll = (event: Event): void => {
    if (this.activeFilterDropdown === null) return;
    const target = event.target as HTMLElement | null;
    if (target && target.closest('.filter-dropdown-portal')) return;
    this.closeFilterDropdown();
  };

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  goToSpecs(car?: StoreCar, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/specs'], car ? { queryParams: { id: car.id } } : {});
  }

  goHome(): void {
    this.router.navigate(['']);
  }

  goToImport(): void {
    this.router.navigate(['/imported-trade-in'], { queryParams: { tab: 'import' } });
  }

  goToTradeIn(): void {
    this.router.navigate(['/imported-trade-in'], { queryParams: { tab: 'trade-in' } });
  }

  gotoFinance(): void {
    this.router.navigate(['/financing']);
  }
}