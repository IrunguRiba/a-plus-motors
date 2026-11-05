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

type CarBody = 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'hatchback';
type CarFilter = 'all' | CarBody;

interface Car {
  id: number;
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
  monthlyFinance: string;
  /** Base likes recorded (from backend). */
  likes: number;
  /** Base shares recorded (from backend). */
  shares: number;
  /** Body style for filtering. Optional; untyped cars fall back to matching by text. */
  body?: CarBody;
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

  /** Reference to DOM elements for the scroll-reveal animation. */
  @ViewChildren('reveal') revealElements!: QueryList<ElementRef>;

  /** Belt drag refs. */
  @ViewChild('beltViewport', { static: false }) beltViewport?: ElementRef<HTMLElement>;
  @ViewChild('beltTrack', { static: false }) beltTrack?: ElementRef<HTMLElement>;

  /** Track user interactions locally (to be synced with backend later). */
  private likedIds = new Set<number>();
  private bookmarkedIds = new Set<number>();
  private sharedExtra = new Map<number, number>();

  /** State for the "Link copied" clipboard fallback. */
  copiedId: number | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  /** Base shuffled car list (single copy). */
  private baseCars: Car[] = [];

  /** What the template renders. Repeats baseCars enough times to overflow the viewport. */
  displayCars: Car[] = [];
  displayBrands: Brand[] = [];

  /** Currently selected filter. */
  activeFilter: CarFilter = 'all';

  /** ---- Belt drag state ---- */
  beltDragging = false;
  beltTransform = '';
  private dragStartX = 0;
  private dragStartOffset = 0;
  private currentOffset = 0;
  /** Width of ONE copy of the repeated list — the wrap distance. */
  private loopWidth = 0;
  private pointerId: number | null = null;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  /** Auto-scroll speed in px per second. */
  private readonly autoSpeed = 60;
  private readonly reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    // Shuffle once so all views share the same ordering.
    this.baseCars = [...this.cars].sort(() => Math.random() - 0.5);
    this.displayCars = this.repeatToFill(this.baseCars);
    this.displayBrands = [...this.brands];
  }

  ngAfterViewInit() {
    // Scroll-reveal for text paragraphs (kept from original).
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

    const textNodes = document.querySelectorAll('.into-txt .reveal');
    textNodes.forEach((node) => observer.observe(node));

    // Kick off the belt once layout is ready.
    setTimeout(() => this.setupBelt(), 0);
    // Re-measure on resize so the loop distance stays accurate.
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize, { passive: true });
    }
  }

  ngOnDestroy() {
    this.stopBeltLoop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  private onResize = () => {
    // Re-measure loop width after layout settles.
    setTimeout(() => this.measureLoop(), 0);
  };

  /** Navigation handlers */
  openSpecs() {
    this.openedSpecs = !this.openedSpecs;
    this.router.navigate(['/specs']);
  }

  goToStore() {
    this.router.navigate(['/store']);
  }

  /* ============================================================
     FILTERS
     ============================================================ */

  setFilter(filter: CarFilter) {
    this.activeFilter = filter;

    if (filter === 'all') {
      this.displayCars = this.repeatToFill(this.baseCars);
    } else {
      const matches = this.baseCars.filter((car) => this.matchesBody(car, filter));
      this.displayCars = this.repeatToFill(matches);
    }

    this.currentOffset = 0;
    this.cdr.markForCheck();
    setTimeout(() => this.setupBelt(), 0);
  }

  /**
   * Repeats the list enough times that the total track is at least twice the
   * viewport width, guaranteeing it overflows even with very few matches.
   * The result is treated as N copies of the same sequence; the loop width is
   * the width of one copy (total / copies).
   */
  private repeatToFill(list: Car[]): Car[] {
    if (list.length === 0) return [];
    const viewportW =
      this.beltViewport?.nativeElement?.clientWidth ||
      (typeof window !== 'undefined' ? window.innerWidth : 1920);
    // Estimate one card + bridge width so we can pick a copy count up front.
    const perItem = 920; // 880 card + 40 bridge
    const estListWidth = Math.max(list.length * perItem, 1);
    const copiesNeeded = Math.max(3, Math.ceil((viewportW * 2) / estListWidth) + 1);
    const out: Car[] = [];
    for (let i = 0; i < copiesNeeded; i++) out.push(...list);
    return out;
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

  /** Check if a specific car has been liked/bookmarked by the user. */
  isLiked(id: number): boolean {
    return this.likedIds.has(id);
  }

  isBookmarked(id: number): boolean {
    return this.bookmarkedIds.has(id);
  }

  /** Calculate total likes (base + user interaction). */
  likeCount(car: Car): number {
    return car.likes + (this.likedIds.has(car.id) ? 1 : 0);
  }

  /** Calculate total shares (base + user interaction). */
  shareCount(car: Car): number {
    return car.shares + (this.sharedExtra.get(car.id) ?? 0);
  }

  /** Format large numbers elegantly: 950 -> "950", 1240 -> "1.2K", 15300 -> "15K". */
  formatCount(n: number): string {
    if (n >= 1_000_000) return this.trim(n / 1_000_000) + 'M';
    if (n >= 1_000) return this.trim(n / 1_000) + 'K';
    return String(n);
  }

  private trim(value: number): string {
    return (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10).toString();
  }

  /** Toggle local state for likes and bookmarks. */
  toggleLike(id: number, event: Event) {
    event.stopPropagation();
    this.likedIds.has(id) ? this.likedIds.delete(id) : this.likedIds.add(id);
  }

  toggleBookmark(id: number, event: Event) {
    event.stopPropagation();
    this.bookmarkedIds.has(id) ? this.bookmarkedIds.delete(id) : this.bookmarkedIds.add(id);
  }

  /** Handle sharing via native OS share sheet, or fallback to clipboard. */
  async shareCar(car: Car, event: Event) {
    event.stopPropagation();

    const title = `${car.year} ${car.make.replace(/\s+/g, '')} ${car.model.trim()}`;
    const text = `${title}: ${car.price}`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        this.countShare(car.id);
      } catch {
        // User dismissed the share sheet: do not count
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      this.countShare(car.id);
      this.copiedId = car.id;

      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => (this.copiedId = null), 1600);
    } catch {
      // Clipboard access blocked: fail silently
    }
  }

  private countShare(id: number) {
    this.sharedExtra.set(id, (this.sharedExtra.get(id) ?? 0) + 1);
  }

  /* ============================================================
     BELT · drag + gentle auto scroll (infinite)
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

  /** Measure the width of ONE copy of the repeated sequence. */
  private measureLoop() {
    const track = this.beltTrack?.nativeElement;
    if (!track || this.displayCars.length === 0) return;

    // How many copies did we render? Derive from baseCars length vs total length.
    const baseLen = this.baseCars.length || 1;
    const total = this.displayCars.length;
    const copies = Math.max(1, Math.round(total / baseLen));
    this.loopWidth = track.scrollWidth / copies;

    // Ensure the loop width is at least the viewport; if not, widen by duplicating.
    const viewportW = this.beltViewport?.nativeElement?.clientWidth || 0;
    if (this.loopWidth > 0 && this.loopWidth < viewportW * 1.5) {
      // Duplicate the rendered sequence again so the track fills properly.
      const doubled = [...this.displayCars, ...this.displayCars];
      this.displayCars = doubled;
      this.cdr.markForCheck();
      // Re-measure on next frame.
      setTimeout(() => this.measureLoop(), 0);
      return;
    }

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
    // Normalise so currentOffset is in (-loopWidth, 0].
    while (this.currentOffset <= -this.loopWidth) this.currentOffset += this.loopWidth;
    while (this.currentOffset > 0) this.currentOffset -= this.loopWidth;
  }

  private applyTransform() {
    const el = this.beltTrack?.nativeElement;
    if (el) {
      el.style.transform = `translate3d(${this.currentOffset}px, 0, 0)`;
    }
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

  // --- Data ---

  cars: Car[] = [
    {
      id: 1,
      year: 2019,
      make: 'B M W',
      mileage: 'Second Hand',
      model: ' i4 M50',
      description: 'With its aerodynamic curves and bold lines, this car is a standout on the road, turning heads and making a statement wherever it goes.',
      price: 'KSH 8,880,000',
      image: '3.jpg',
      engineCC: '1,998 CC',
      fuelType: 'Electric',
      transmission: 'Automatic',
      monthlyFinance: 'KSH 148,000',
      likes: 1240,
      shares: 86,
      body: 'sedan'
    },
    {
      id: 2,
      year: 2021,
      make: 'B M W',
      mileage: 'New',
      model: ' i4 M50',
      description: 'With its aerodynamic curves and bold lines, this car is a standout on the road, turning heads and making a statement wherever it goes.',
      price: 'KSH 8,880,000',
      image: '3.jpg',
      engineCC: '1,998 CC',
      fuelType: 'Electric',
      transmission: 'Automatic',
      monthlyFinance: 'KSH 148,000',
      likes: 932,
      shares: 54,
      body: 'coupe'
    },
    {
      id: 3,
      year: 2022,
      make: 'B M W',
      mileage: 'New',
      model: ' i4 M50',
      description: 'With its aerodynamic curves and bold lines, this car is a standout on the road, turning heads and making a statement wherever it goes.',
      price: 'KSH 8,880,000',
      image: '3.jpg',
      engineCC: '1,998 CC',
      fuelType: 'Electric',
      transmission: 'Automatic',
      monthlyFinance: 'KSH 148,000',
      likes: 2150,
      shares: 140,
      body: 'suv'
    }
  ];

  storeCars: Car[] = [
    {
      id: 1,
      year: 2013,
      make: 'Audi A4',
      mileage: 'Good',
      model: 'A4',
      description: 'Clean executive vehicle.',
      price: 'Ksh 8,695,000',
      image: '3.jpg',
      engineCC: '1,984 CC',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      monthlyFinance: 'KSH 145,000',
      likes: 312,
      shares: 21,
      body: 'sedan'
    }
  ];

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