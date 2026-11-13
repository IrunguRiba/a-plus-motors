import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { Nav2 } from '../nav-2/nav-2';
import { ApiServices } from '../../services/api-services';
import { StoreCar } from '../../interfaces/car-interface';
import { SafeVideoUrlPipe } from '../portfolio/specs/safe-url.pipe';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, Nav2, SafeVideoUrlPipe],
  templateUrl: './store.html',
  styleUrl: './store.css'
})
export class Store implements AfterViewInit, OnDestroy {
  @ViewChild('smoothContent', { static: true }) smoothContent!: ElementRef;
  @ViewChild(Nav2, { read: ElementRef }) nav2!: ElementRef<HTMLElement>;

  private ctx!: gsap.Context;
  private navCtx!: gsap.Context;
  private destroyed = false;
  private carsSub?: Subscription;

  private readonly LIKED_KEY = 'aplus.store.liked';
  private readonly SAVED_KEY = 'aplus.store.saved';

  /**
   * Base URL of the API/media server. Used when the API returns a relative
   * review-video path such as "/uploads/review.mp4". Change to your real host
   * (or read it from environment.ts).
   */
  private static readonly MEDIA_BASE = 'http://localhost:4000';

  constructor(
    private router: Router,
    private location: Location,
    private api: ApiServices
  ) {
    this.liked = this.load(this.LIKED_KEY);
    this.saved = this.load(this.SAVED_KEY);
    this.fetchCars();
  }

  private allCars: StoreCar[] = [];

  cars: StoreCar[] = [];

  loading = true;
  error = '';

  readonly pageSize = 6;
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

  /** Cars whose review video failed to load: they fall back to image only. */
  private previewFailed = new Set<string>();

  trackById(_: number, car: StoreCar): string {
    return car.id;
  }

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
          { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: 'power2.out', stagger: 0.04, clearProps: 'opacity,transform' }
        );
      });
    }, 0);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  /* ============================================================
     FULL-IMAGE HOVER PREVIEW (video / iframe)
     ============================================================ */

  /** Clean up whatever the API returns (spaces, //host, relative paths). */
  private normalize(raw?: string | null): string | null {
    let u = (raw ?? '').toString().trim();
    if (!u) return null;
    if (u.startsWith('//')) return 'https:' + u;
    if (/^https?:\/\//i.test(u)) return u;
    // relative path from the API -> serve it from the media server
    return Store.MEDIA_BASE.replace(/\/+$/, '') + '/' + u.replace(/^\/+/, '');
  }

  /** Embed URL for known video hosts, otherwise null. */
  private embedFor(u: string): string | null {
    const yt = u.match(
      /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i,
    );
    if (yt) {
      return (
        `https://www.youtube-nocookie.com/embed/${yt[1]}` +
        `?rel=0&autoplay=1&mute=1&loop=1&playlist=${yt[1]}&playsinline=1&controls=0&modestbranding=1`
      );
    }

    const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1&background=1`;

    const sm = u.match(/streamable\.com\/(?:e\/)?([a-z0-9]+)/i);
    if (sm) return `https://streamable.com/e/${sm[1]}?autoplay=1&muted=1&loop=1`;

    return null;
  }

  /**
   * Anything that is not a known embed host is played with a <video> tag,
   * even when the URL has no extension (Cloudinary, S3, GridFS, /api/video/:id ...).
   * If the browser can't play it, (error) puts the card back to image-only.
   */
  private fileUrl(car: StoreCar): string | null {
    const u = this.normalize(car.reviewVideoUrl);
    if (!u || this.embedFor(u)) return null;
    return u;
  }

  private embedUrl(car: StoreCar): string | null {
    const u = this.normalize(car.reviewVideoUrl);
    return u ? this.embedFor(u) : null;
  }

  previewFileUrl(car: StoreCar): string | null {
    return this.fileUrl(car);
  }

  previewEmbedUrl(car: StoreCar): string | null {
    return this.embedUrl(car);
  }

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
    // Angular doesn't reflect the `muted` attribute onto dynamically created
    // <video> elements, and browsers block autoplay unless the property is set.
    el.muted = true;
    el.defaultMuted = true;
    if (el.paused) {
      el.play().catch(() => { /* autoplay suppressed — image stays visible */ });
    }
  }

  onPreviewReady(el: HTMLElement): void {
    // Reveal the preview only once it is actually playing / loaded
    el.classList.add('ready');
  }

  ngAfterViewInit(): void {
    this.supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

    this.setupFloatingNav();

    document.addEventListener('click', this.onDocumentClick, true);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    document.addEventListener('wheel', this.onScroll, { passive: true });
    document.addEventListener('touchmove', this.onScroll, { passive: true });
  }

  private setupFloatingNav(): void {
    if (!this.nav2?.nativeElement) return;

    const navEl = this.nav2.nativeElement;
    const inner = navEl.querySelector('.floating-menu-wrapper') as HTMLElement | null;
    const target = inner ?? navEl;

    this.navCtx = gsap.context(() => {
      gsap.from(target, {
        opacity: 0,
        x: -80,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.2
      });
    }, navEl);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.carsSub?.unsubscribe();
    this.ctx?.revert();
    this.navCtx?.revert();
    document.removeEventListener('click', this.onDocumentClick, true);
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('wheel', this.onScroll);
    document.removeEventListener('touchmove', this.onScroll);
  }

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

  goToSpecs(car?: StoreCar, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/specs'], car ? { queryParams: { id: car.id } } : {});
  }

  goHome(): void {
    this.router.navigate(['']);
  }

  goToImport(): void {
    this.router.navigate(['/imported-trade-in'], {
      queryParams: { tab: 'import' }
    });
  }

  goToTradeIn(): void {
    this.router.navigate(['/imported-trade-in'], {
      queryParams: { tab: 'trade-in' }
    });
  }

  gotoFinance(): void {
    this.router.navigate(['/financing']);
  }
}