// src/app/home/portfolio/portfolio.ts
import {
  Component,
  ViewChildren,
  ViewChild,
  QueryList,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Specs } from './specs/specs';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiServices } from '../../services/api-services';
import { ApiCar } from '../../interfaces/car-interface';

type CarBody = 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'hatchback';
type CarFilter = 'all' | CarBody;

interface Car {
  id: string;
  year: number;
  make: string;
  mileage: string;
  model: string;
  description: string;
  price: string;
  image: string;
  engineCC: string;
  fuelType: string;
  transmission: string;
  financing: boolean;
  likes: number;
  shares: number;
  body?: CarBody;
  recommended: boolean;
  stockNo: string;
}

interface Brand {
  id: number;
  name: string;
  logo: string;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, Specs],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio implements AfterViewInit, OnDestroy {
  openedSpecs = false;

  readonly recommendedTarget = 6;
  readonly storeMax = 21;
  private static readonly STORE_COLS = 3;

  loading = true;
  error = '';

  @ViewChildren('reveal') revealElements!: QueryList<ElementRef>;

  @ViewChild('beltViewport', { static: false }) beltViewport?: ElementRef<HTMLElement>;
  @ViewChild('beltTrack', { static: false }) beltTrack?: ElementRef<HTMLElement>;

  private likedIds = new Set<string>();
  private bookmarkedIds = new Set<string>();
  private sharedExtra = new Map<string, number>();

  copiedId: string | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  private carsSub?: Subscription;

  /** Recommended pool: flagged first, then newest-cheapest fillers to reach 6. */
  recommendedCars: Car[] = [];

  private storeBaseCars: Car[] = [];
  filteredStoreCars: Car[] = [];

  /** What the belt renders — recommended repeated for a seamless marquee. */
  displayCars: Car[] = [];

  displayBrands: Brand[] = [];
  activeFilter: CarFilter = 'all';

  private beltBase: Car[] = [];
  private filteredBaseLength = 1;

  /* ---- Belt state ---- */
  beltDragging = false;
  beltTransform = '';
  private dragStartX = 0;
  private dragStartOffset = 0;
  private currentOffset = 0;
  private loopWidth = 0;
  private pointerId: number | null = null;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private readonly autoSpeed = 60;
  private readonly reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private api: ApiServices
  ) {
    this.displayBrands = [...this.brands];
    this.fetchCars();
  }

  /* ============================================================
     DATA FETCH
     ============================================================ */

  fetchCars(): void {
    this.loading = true;
    this.error = '';
    this.carsSub?.unsubscribe();

    this.carsSub = this.api.getAllCars().subscribe({
      next: (all) => {
        const web = all.filter((c) => c.showOnWeb);

        const flagged = web.filter((c) => c.recommended);
        const flaggedIds = new Set(flagged.map((c) => c._id));

        const fillCount = Math.max(0, this.recommendedTarget - flagged.length);
        const fillers = fillCount
          ? web
              .filter((c) => !flaggedIds.has(c._id))
              .sort((a, b) => {
                const dt =
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime();
                if (dt !== 0) return dt;
                return (a.price ?? 0) - (b.price ?? 0);
              })
              .slice(0, fillCount)
          : [];

        const recommendedPool = [...flagged, ...fillers];

        this.recommendedCars = this.dedupeById(
          recommendedPool.map((c) => this.toCar(c))
        );

        const recommendedIds = new Set(recommendedPool.map((c) => c._id));
        const storeCars = this.dedupeById(
          web
            .filter((c) => !recommendedIds.has(c._id))
            .map((c) => this.toCar(c))
        );

        this.storeBaseCars = this.shuffle([...storeCars]).slice(0, this.storeMax);
        this.filteredStoreCars = [...this.storeBaseCars];

        this.buildRecommendedBelt();

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'We could not load the cars right now. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  private dedupeById(cars: Car[]): Car[] {
    const seen = new Set<string>();
    const out: Car[] = [];
    for (const c of cars) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
    return out;
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private toCar(c: ApiCar): Car {
    const financingEnabled = !!(c.financing && c.finance?.enabled);
    return {
      id: c._id,
      year: c.year,
      make: c.make,
      mileage: `${(c.mileage ?? 0).toLocaleString('en-US')} km`,
      model: c.model,
      description: c.notes ?? '',
      price: `KSH ${(c.price ?? 0).toLocaleString('en-US')}`,
      image: c.photos?.[0] ?? '',
      engineCC: `${(c.engine ?? 0).toLocaleString('en-US')} CC`,
      fuelType: c.fuel,
      transmission: c.transmission,
      financing: financingEnabled,
      likes: 0,
      shares: 0,
      body: this.toBody(c.body),
      recommended: !!c.recommended,
      stockNo: c.stockNo,
    };
  }

  private toBody(value: string | undefined): CarBody | undefined {
    const v = (value ?? '').toLowerCase();
    if (v.includes('suv') || v.includes('crossover')) return 'suv';
    if (v.includes('pickup') || v.includes('truck')) return 'truck';
    if (v.includes('van') || v.includes('mpv')) return 'van';
    if (v.includes('coupe') || v.includes('coupé')) return 'coupe';
    if (v.includes('hatch')) return 'hatchback';
    if (v.includes('sedan') || v.includes('saloon')) return 'sedan';
    return undefined;
  }

  /* ============================================================
     BELT / MARQUEE
     ============================================================ */

  private buildRecommendedBelt(): void {
    this.beltBase = [...this.recommendedCars];

    if (!this.beltBase.length) {
      this.displayCars = [];
      this.filteredBaseLength = 1;
      this.loopWidth = 0;
      return;
    }

    this.filteredBaseLength = this.beltBase.length;
    this.displayCars = [...this.beltBase];

    this.currentOffset = 0;
    this.cdr.markForCheck();
    setTimeout(() => this.setupBelt(), 0);
  }

  get storeRows(): Car[][] {
    const flat = this.filteredStoreCars.slice(0, this.storeMax);
    const rows: Car[][] = [];
    for (let i = 0; i < flat.length; i += Portfolio.STORE_COLS) {
      rows.push(flat.slice(i, i + Portfolio.STORE_COLS));
    }
    return rows;
  }

  trackById = (_: number, car: Car) => car.id;
  trackByRow = (_: number, row: Car[]) => row.map((c) => c.id).join('|');

  /* ============================================================
     LIFECYCLE
     ============================================================ */

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.into-txt .reveal').forEach((node) => observer.observe(node));

    setTimeout(() => this.setupBelt(), 0);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize, { passive: true });
    }
  }

  ngOnDestroy() {
    this.carsSub?.unsubscribe();
    this.stopBeltLoop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  private onResize = () => {
    setTimeout(() => this.measureLoop(), 0);
  };

  /* ============================================================
     NAVIGATION
     ============================================================ */

  openSpecs(car?: Car) {
    this.openedSpecs = !this.openedSpecs;
    this.router.navigate(['/specs'], car ? { queryParams: { id: car.id } } : {});
  }

  goToStore() {
    this.router.navigate(['/store']);
  }

  /* ============================================================
     FILTERS — store grid only
     ============================================================ */

  setFilter(filter: CarFilter) {
    this.activeFilter = filter;

    if (filter === 'all') {
      this.filteredStoreCars = [...this.storeBaseCars];
    } else {
      this.filteredStoreCars = this.storeBaseCars.filter((car) =>
        this.matchesBody(car, filter)
      );
    }

    this.cdr.markForCheck();
  }

  private matchesBody(car: Car, body: CarBody): boolean {
    if (car.body) return car.body === body;
    const text = `${car.model} ${car.description}`.toLowerCase();
    switch (body) {
      case 'suv': return /suv|crossover|4x4/.test(text);
      case 'truck': return /truck|pickup|lorry/.test(text);
      case 'van': return /van|minivan|mpv/.test(text);
      case 'coupe': return /coupe|coupé/.test(text);
      case 'hatchback': return /hatch|hatchback/.test(text);
      case 'sedan': return /sedan|saloon/.test(text);
    }
  }

  /* ============================================================
     INTERACTIONS
     ============================================================ */

  isLiked(id: string): boolean { return this.likedIds.has(id); }
  isBookmarked(id: string): boolean { return this.bookmarkedIds.has(id); }
  likeCount(car: Car): number { return car.likes + (this.likedIds.has(car.id) ? 1 : 0); }
  shareCount(car: Car): number { return car.shares + (this.sharedExtra.get(car.id) ?? 0); }

  formatCount(n: number): string {
    if (n >= 1_000_000) return this.trim(n / 1_000_000) + 'M';
    if (n >= 1_000) return this.trim(n / 1_000) + 'K';
    return String(n);
  }

  private trim(value: number): string {
    return (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10).toString();
  }

  toggleLike(id: string, event: Event) {
    event.stopPropagation();
    this.likedIds.has(id) ? this.likedIds.delete(id) : this.likedIds.add(id);
  }

  toggleBookmark(id: string, event: Event) {
    event.stopPropagation();
    this.bookmarkedIds.has(id) ? this.bookmarkedIds.delete(id) : this.bookmarkedIds.add(id);
  }

  async shareCar(car: Car, event: Event) {
    event.stopPropagation();

    const title = `${car.year} ${car.make.replace(/\s+/g, '')} ${car.model.trim()}`;
    const text = `${title}: ${car.price}`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        this.countShare(car.id);
      } catch { /* dismissed */ }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      this.countShare(car.id);
      this.copiedId = car.id;
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => (this.copiedId = null), 1600);
    } catch { /* blocked */ }
  }

  private countShare(id: string) {
    this.sharedExtra.set(id, (this.sharedExtra.get(id) ?? 0) + 1);
  }

  /* ============================================================
     BELT · loop logic
     ============================================================ */

  private setupBelt() {
    const track = this.beltTrack?.nativeElement;
    if (!track) return;

    this.measureLoop();
    this.currentOffset = 0;
    this.beltTransform = 'translate3d(0px, 0, 0)';
    this.applyTransform();
    this.startBeltLoop();
  }

  /** Pads belt copies so it always overflows the viewport by ≥ one full copy. */
  private measureLoop() {
    const track = this.beltTrack?.nativeElement;
    if (!track || this.beltBase.length === 0) return;

    const baseLen = this.beltBase.length;
    if (baseLen <= 0) return;

    const total = this.displayCars.length;
    const copies = Math.max(1, Math.round(total / baseLen));
    const oneCopyWidth = track.scrollWidth / copies;
    if (oneCopyWidth <= 0) return;

    const viewportW = this.beltViewport?.nativeElement?.clientWidth || 0;

    const neededCopies = Math.max(
      2,
      Math.min(6, Math.ceil((viewportW + oneCopyWidth) / oneCopyWidth))
    );

    if (neededCopies > copies || total % baseLen !== 0) {
      const next: Car[] = [];
      for (let i = 0; i < neededCopies; i++) next.push(...this.beltBase);
      this.displayCars = next;
      this.cdr.markForCheck();
      setTimeout(() => this.measureLoop(), 0);
      return;
    }

    this.loopWidth = oneCopyWidth;
    this.filteredBaseLength = baseLen;
    this.wrapOffset();
  }

  private startBeltLoop() {
    if (this.reducedMotion) return;
    this.stopBeltLoop();
    this.zone.runOutsideAngular(() => {
      const step = (t: number) => {
        if (!this.lastFrameTime) this.lastFrameTime = t;
        const dt = Math.min((t - this.lastFrameTime) / 1000, 0.05);
        this.lastFrameTime = t;

        if (!this.beltDragging) {
          this.currentOffset -= this.autoSpeed * dt;
        }
        this.wrapOffset();
        this.applyTransform();
        this.rafId = requestAnimationFrame(step);
      };
      this.rafId = requestAnimationFrame(step);
    });
  }

  private stopBeltLoop() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastFrameTime = 0;
  }

  private wrapOffset() {
    if (this.loopWidth <= 0) return;
    while (this.currentOffset <= -this.loopWidth) this.currentOffset += this.loopWidth;
    while (this.currentOffset > 0) this.currentOffset -= this.loopWidth;
  }

  private applyTransform() {
    const el = this.beltTrack?.nativeElement;
    if (el) el.style.transform = `translate3d(${this.currentOffset}px, 0, 0)`;
  }

  onBeltPointerDown(event: PointerEvent) {
    if (this.reducedMotion) return;
    if (event.button !== undefined && event.button !== 0) return;

    const track = this.beltTrack?.nativeElement;
    if (!track) return;

    event.preventDefault();
    this.pointerId = event.pointerId;
    this.beltDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartOffset = this.currentOffset;

    const vp = this.beltViewport?.nativeElement;
    vp?.setPointerCapture?.(event.pointerId);
    this.cdr.markForCheck();
  }

  onBeltPointerMove(event: PointerEvent) {
    if (!this.beltDragging) return;
    if (this.pointerId !== null && event.pointerId !== this.pointerId) return;

    event.preventDefault();
    const dx = event.clientX - this.dragStartX;
    this.currentOffset = this.dragStartOffset + dx;
    this.wrapOffset();
    this.applyTransform();
  }

  onBeltPointerUp(event: PointerEvent) {
    if (!this.beltDragging) return;
    if (this.pointerId !== null && event.pointerId !== this.pointerId) return;

    this.beltDragging = false;
    this.pointerId = null;
    this.lastFrameTime = 0;

    const vp = this.beltViewport?.nativeElement;
    vp?.releasePointerCapture?.(event.pointerId);
    this.cdr.markForCheck();
  }

  /* ============================================================
     BRANDS
     ============================================================ */

  brands: Brand[] = [
    { id: 1, name: 'Toyota', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/toyota.png' },
    { id: 2, name: 'Subaru', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/subaru.png' },
    { id: 3, name: 'Nissan', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/nissan.png' },
    { id: 4, name: 'Honda', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/honda.png' },
    { id: 5, name: 'Mazda', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mazda.png' },
    { id: 6, name: 'BMW', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/bmw.png' },
    { id: 7, name: 'Mercedes', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mercedes-benz.png' },
    { id: 8, name: 'Audi', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/audi.png' },
    { id: 9, name: 'Volkswagen', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/volkswagen.png' },
    { id: 10, name: 'Mitsubishi', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mitsubishi.png' }
  ];
}