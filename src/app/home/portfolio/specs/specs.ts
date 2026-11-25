// src/app/home/portfolio/specs/specs.ts
import {
  Component,
  DestroyRef,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  HostListener,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, CanDeactivateFn } from '@angular/router';
import { Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ApiServices, InquiryRequestPayload, ksh } from '../../../services/api-services';
import { ApiCar } from '../../../interfaces/car-interface';
import { SafeVideoUrlPipe } from './safe-url.pipe';
import { Footer } from '../../footer/footer';
import {
  ReviewVideo,
  resolveReviewVideo,
  primeMutedVideo,
  markReady,
  canHover,
  prefersReducedMotion,
} from './review-video';
import { Nav } from '../../nav/nav';

type CarView = 'exterior' | 'interior';
interface SpecRow {
  label: string;
  value: string;
}
interface SpecGroup {
  title: string;
  rows: SpecRow[];
}
interface SimilarCar {
  id: string;
  name: string;
  brand: string;
  year: string;
  price: string;
  meta: string;
  why: string;
  image: string;
  /** Review video played on hover (null when the car has none). */
  preview: ReviewVideo | null;
}

type BodyBucket = 'suv' | 'truck' | 'van' | 'coupe' | 'hatchback' | 'sedan' | 'other';

const MOTION = {
  enterDuration: 0.35,
  enterX: -60,
  enterScale: 0.85,
  enterStagger: 0.04,
  enterEase: 'power2.out',
  leaveDuration: 0.28,
  leaveOffset: -6,
  leaveEase: 'power1.inOut',
};

/** Two taps/clicks closer than this (ms) and this (px) apart count as a double tap. */
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 30;

@Component({
  selector: 'app-specs',
  templateUrl: './specs.html',
  imports: [CommonModule, FormsModule, SafeVideoUrlPipe, Footer, Nav],
  styleUrls: ['./specs.css'],
  host: { style: 'overflow: clip' },
})
export class Specs implements AfterViewInit, OnDestroy {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiServices,
  ) {
    this.jumpToTop();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      // FIX: /specs?id=... is the same route, so Angular reuses this component when a
      // searched / similar car is picked. Nothing destroyed the nav state, so the
      // search window and menu stayed open over the new car. Reset them on every
      // car change.
      this.closeNavOverlays();
      this.loadCar(params.get('id'));
    });
  }

  private location = inject(Location);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('modalRoot') modalRoot!: ElementRef<HTMLElement>;
  @ViewChild('lightRoot') lightRoot!: ElementRef<HTMLElement>;

  private viewReady = false;
  private loadSub?: Subscription;
  private submitSub?: Subscription;

  private jumpToTop(): void {
    ScrollSmoother.get()?.scrollTo(0, false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }

  private get reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ============================================================
     MAIN NAV STATE (bound to <app-nav>)
     ============================================================ */

  searchWindowOpened = false;
  isMenuOpen = false;
  /** Leading slash so the path resolves against the app root on every route. */
  logoImg = '/fav3.png';

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

  /**
   * Closes the search window and the menu. Used when the car changes without the
   * component being recreated. If the search/menu locked page scroll, release it
   * (unless our own modal or lightbox is open and still needs it).
   */
  private closeNavOverlays(): void {
    const wasOpen = this.searchWindowOpened || this.isMenuOpen;
    this.searchWindowOpened = false;
    this.isMenuOpen = false;
    if (wasOpen && !this.modalOpen && !this.expanded) {
      this.lockScroll(false);
    }
  }

  /* ============================================================
     CAR DATA
     ============================================================ */

  loading = true;
  notFound = false;

  car?: ApiCar;

  seriesName = '';
  carName = '';
  carPrice = '';

  get financingEnabled(): boolean {
    return !!(this.car?.financing && this.car?.finance?.enabled);
  }

  get financingLabel(): string {
    return this.financingEnabled ? 'Financing available' : 'Financing on request';
  }

  /** Stock status from the database, e.g. "inStock" becomes "In Stock". */
  get availabilityLabel(): string {
    const raw = String(this.car?.availabilityStatus ?? '').trim();
    if (!raw) return '';
    return raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (ch) => ch.toUpperCase());
  }

  views: CarView[] = ['exterior', 'interior'];

  exteriorSpecs: SpecGroup[] = [];
  interiorSpecs: SpecGroup[] = [];

  exteriorImages: string[] = [];
  interiorImages: string[] = [];

  reviewVid = '';

  pickCriteria = [
    'Same brand or class',
    'Similar body style',
    'Comparable price',
    'Close model year',
  ];

  similarVehicles: SimilarCar[] = [];

  footerLinks = [
    { label: 'Explore our financing', route: '/financing' },
    { label: 'Import a car', route: '/import' },
    { label: 'Trade in', route: '/trade-in' },
    { label: 'Contact us', route: '/contact' },
    { label: 'Sell your car', route: '/sell' },
    { label: 'Book a test drive', route: '/test-drive' },
  ];

  /**
   * Loads the catalogue from the API (cached in ApiServices), picks the requested car
   * by ?id=, and falls back to a recommended / first web-visible car if the id is missing
   * or unknown.
   */
  private loadCar(id: string | null): void {
    this.loading = true;
    this.notFound = false;
    this.loadSub?.unsubscribe();
    this.loadSub = this.api.getAllCars().subscribe({
      next: (all) => {
        const web = all.filter((c) => c.showOnWeb);
        const car = id
          ? (all.find((c) => c._id === id) ?? web.find((c) => c.recommended) ?? web[0])
          : (web.find((c) => c.recommended) ?? web[0] ?? all[0]);

        this.loading = false;
        if (!car) {
          this.notFound = true;
          return;
        }
        this.applyCar(car, web);
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      },
    });
  }

  private applyCar(c: ApiCar, pool: ApiCar[]): void {
    this.notFound = false;
    if (this.expanded) this.closeLightbox();

    this.car = c;
    this.seriesName = `${c.make} ${c.model}`;
    this.carName = `${c.year} ${c.make} ${c.model}`;
    this.carPrice = ksh(c.price);

    // Order is kept: the FIRST photo of the car is the one shown when the page opens.
    const photos = Array.from(new Set((c.photos ?? []).filter(Boolean)));
    this.exteriorImages = photos;
    this.interiorImages = photos;
    this.reviewVid = (c.reviewVideoUrl ?? '').trim();
    this.preloadImage(photos[0]);

    this.exteriorSpecs = this.buildExterior(c);
    this.interiorSpecs = this.buildInterior(c);
    this.similarVehicles = this.buildSimilar(c, pool);

    this.view = 'exterior';
    this.activeIndex = 0;
    this.stackExpanded = false;
    this.videoPlaying = false;
    this.zoom = 100;
    this.resetPan();
    this.hoveredId = null;

    // FIX: Always (re)wire lazy images once the new similar-car cards have rendered.
    // The old code only did this inside `if (this.viewReady)` with a single
    // setTimeout(0) — which fires before Angular flushes the @for cards, so every
    // similar-car <img> kept its data-src and never got a `src` (blank cards).
    this.scheduleCardImages();

    if (this.viewReady) {
      this.jumpToTop();
      setTimeout(() => {
        this.playEnter();
        // Gallery strip starts at the first photo.
        this.revealActiveThumb();
      }, 0);
    }
  }

  /**
   * FIX: Run observeCardImages() after the DOM actually contains the newly-rendered
   * cards. requestAnimationFrame fires after change detection; the extra setTimeout
   * handles the case where Angular renders the cards a tick later. A 250ms retry is
   * the safety net for slow/async renders.
   */
  private scheduleCardImages(): void {
    const run = () => this.observeCardImages();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(run, 0));
    } else {
      setTimeout(run, 0);
    }
    setTimeout(run, 250);
  }

  /** Starts loading the first photo right away so the viewer never opens on a blank stage. */
  private preloadImage(src: string | undefined): void {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
  }

  /* ============================================================
     SPEC BUILDERS
     ============================================================ */

  private buildExterior(c: ApiCar): SpecGroup[] {
    const groups: SpecGroup[] = [
      {
        title: 'Engine & Performance',
        rows: [
          { label: 'Engine', value: this.num(c.engine, ' cc') },
          { label: 'Fuel', value: c.fuel },
          { label: 'Transmission', value: c.transmission },
          { label: 'Drivetrain', value: c.drive },
        ],
      },
      {
        title: 'Vehicle',
        rows: [
          { label: 'Body', value: c.body },
          { label: 'Colour', value: c.colour },
          { label: 'Year', value: c.year ? String(c.year) : '' },
          { label: 'Mileage', value: this.num(c.mileage, ' km') },
        ],
      },
      {
        title: 'Pricing',
        rows: [
          { label: 'Price', value: ksh(c.price) },
          { label: 'Negotiable', value: c.negotiable ? 'Yes' : 'No' },
          { label: 'Financing', value: this.financingEnabled ? 'Available' : 'On request' },
        ],
      },
      {
        title: 'Listing',
        rows: [
          { label: 'Stock no', value: c.stockNo },
          { label: 'Branch', value: c.branch },
          { label: 'Source', value: c.source },
          { label: 'VIN', value: c.vin },
        ],
      },
    ];

    return groups
      .map((g) => ({ ...g, rows: g.rows.filter((r) => this.hasValue(r.value)) }))
      .filter((g) => g.rows.length > 0);
  }

  private buildInterior(c: ApiCar): SpecGroup[] {
    const groups: SpecGroup[] = [];

    const features = (c.features ?? []).filter(Boolean);
    if (features.length) {
      groups.push({
        title: 'Features',
        rows: features.map((f) => ({ label: f, value: 'Included' })),
      });
    }

    if (this.financingEnabled && c.finance) {
      const f = c.finance;
      const partner =
        f.bankDetails?.[0]?.fullName ?? f.bankFullName ?? f.primaryBank ?? f.banks?.[0];

      const financeRows: SpecRow[] = [
        { label: 'Partner', value: partner ?? '' },
        { label: 'Rate', value: f.rate != null ? `${f.rate}%` : '' },
        { label: 'Deposit', value: f.deposit != null ? `${f.deposit}%` : '' },
        { label: 'Term', value: f.term != null ? `${f.term} months` : '' },
        { label: 'Max financed', value: f.maxAmount != null ? ksh(f.maxAmount) : '' },
        { label: 'Est. monthly', value: f.monthly != null ? ksh(f.monthly) : '' },
      ].filter((r) => this.hasValue(r.value));

      if (financeRows.length) {
        groups.push({ title: 'Finance', rows: financeRows });
      }
    } else if (c.financing === false || c.finance?.enabled === false) {
      groups.push({
        title: 'Finance',
        rows: [{ label: 'Financing', value: 'On request' }],
      });
    }

    if (c.notes?.trim()) {
      groups.push({
        title: 'Notes',
        rows: [{ label: 'Details', value: c.notes.trim() }],
      });
    }

    return groups;
  }

  private buildSimilar(c: ApiCar, pool: ApiCar[]): SimilarCar[] {
    const targetBody = this.bucket(c.body);
    const scored = pool
      .filter((o) => o._id !== c._id)
      .map((o) => {
        const reasons: string[] = [];
        let score = 0;

        if (o.make && o.make === c.make) {
          score += 3;
          reasons.push(`the same ${c.make} brand`);
        }
        if (targetBody !== 'other' && this.bucket(o.body) === targetBody) {
          score += 2;
          reasons.push(`a similar ${targetBody} body`);
        }
        if (c.price > 0 && Math.abs(o.price - c.price) <= c.price * 0.25) {
          score += 2;
          reasons.push('a comparable price');
        }
        if (Math.abs(o.year - c.year) <= 2) {
          score += 1;
          reasons.push('a close model year');
        }
        return { o, score, reasons };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return scored.map(({ o, reasons }) => ({
      id: o._id,
      name: o.model,
      brand: o.make,
      year: String(o.year),
      price: ksh(o.price),
      meta: [o.fuel, this.num(o.engine, ' cc'), o.drive].filter(Boolean).join(' · '),
      why: reasons.length
        ? `Matches on ${this.joinReasons(reasons)}.`
        : 'Another strong option from our yard.',
      image: o.photos?.[0] ?? '',
      preview: resolveReviewVideo(o.reviewVideoUrl),
    }));
  }

  /* ============================================================
     HELPERS
     ============================================================ */

  private hasValue(v: string | undefined | null): boolean {
    return v != null && String(v).trim().length > 0;
  }

  private num(n: number | undefined | null, suffix = ''): string {
    if (n == null || !isFinite(n) || n <= 0) return '';
    return `${n.toLocaleString('en-US')}${suffix}`;
  }

  private bucket(body: string | undefined): BodyBucket {
    const v = (body ?? '').toLowerCase();
    if (v.includes('suv') || v.includes('crossover')) return 'suv';
    if (v.includes('pickup') || v.includes('truck')) return 'truck';
    if (v.includes('van') || v.includes('mpv')) return 'van';
    if (v.includes('coupe') || v.includes('coupé')) return 'coupe';
    if (v.includes('hatch')) return 'hatchback';
    if (v.includes('sedan') || v.includes('saloon')) return 'sedan';
    return 'other';
  }

  private joinReasons(reasons: string[]): string {
    if (reasons.length === 1) return reasons[0];
    if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`;
    return `${reasons.slice(0, -1).join(', ')}, and ${reasons[reasons.length - 1]}`;
  }

  /* ============================================================
     GALLERY STATE
     ============================================================ */

  view: CarView = 'exterior';
  /** Index 0 is the car's first photo, which is what the viewer shows when the page opens. */
  activeIndex = 0;
  stackExpanded = false;

  /** True while the enlarged (full-screen) image viewer is open. */
  expanded = false;

  get images(): string[] {
    return this.view === 'exterior' ? this.exteriorImages : this.interiorImages;
  }
  get activeSpecs(): SpecGroup[] {
    return this.view === 'exterior' ? this.exteriorSpecs : this.interiorSpecs;
  }
  get activeImage(): string {
    return this.images[this.activeIndex] ?? '';
  }

  private trimmed = new Map<string, string>();
  private tried = new Set<string>();

  get displayImage(): string {
    return this.trimmed.get(this.activeImage) ?? this.activeImage;
  }

  trimImage(e: Event): void {
    const img = e.target as HTMLImageElement;
    // The photo this <img> was rendered for (not whatever is active by the time it finishes loading).
    const src = img.dataset['orig'] || this.activeImage;
    this.clampPan();
    if (this.tried.has(src) || !img.naturalWidth) return;
    this.tried.add(src);
    try {
      const W = img.naturalWidth,
        H = img.naturalHeight;
      const k = Math.min(1, 600 / Math.max(W, H));
      const sw = Math.max(1, Math.round(W * k)),
        sh = Math.max(1, Math.round(H * k));
      const probe = document.createElement('canvas');
      probe.width = sw;
      probe.height = sh;
      const pctx = probe.getContext('2d')!;
      pctx.drawImage(img, 0, 0, sw, sh);
      const data = pctx.getImageData(0, 0, sw, sh).data;
      let x0 = sw,
        y0 = sh,
        x1 = -1,
        y1 = -1;
      for (let y = 0; y < sh; y++)
        for (let x = 0; x < sw; x++) {
          if (data[(y * sw + x) * 4 + 3] > 12) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      if (x1 < 0) return;
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > sw * sh * 0.97) return;
      const pad = 0.01;
      const cx = Math.max(0, Math.floor((x0 / sw - pad) * W));
      const cy = Math.max(0, Math.floor((y0 / sh - pad) * H));
      const cw = Math.min(W - cx, Math.ceil(((x1 + 1) / sw - x0 / sw + pad * 2) * W));
      const ch = Math.min(H - cy, Math.ceil(((y1 + 1) / sh - y0 / sh + pad * 2) * H));
      const out = document.createElement('canvas');
      out.width = cw;
      out.height = ch;
      out.getContext('2d')!.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
      this.trimmed.set(src, out.toDataURL('image/png'));
    } catch {
      /* cross-origin: keep original */
    }
  }

  get counter(): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(this.activeIndex + 1)} / ${pad(this.images.length)}`;
  }

  setView(v: CarView): void {
    if (v === this.view) return;
    this.view = v;
    this.activeIndex = 0;
    this.stackExpanded = false;
    this.videoPlaying = false;
    this.resetPan();
    this.revealActiveThumb();
  }

  next(): void {
    if (!this.images.length) return;
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
    this.afterNav();
  }
  prev(): void {
    if (!this.images.length) return;
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
    this.afterNav();
  }
  selectImage(i: number): void {
    this.activeIndex = i;
    this.afterNav();
  }
  toggleStack(): void {
    this.stackExpanded = !this.stackExpanded;
    this.revealActiveThumb();
  }

  private afterNav(): void {
    this.videoPlaying = false;
    this.zoom = 100;
    this.resetPan();
    this.revealActiveThumb();
  }

  private revealActiveThumb(): void {
    setTimeout(() => {
      const track = this.host.nativeElement.querySelector<HTMLElement>('.stack-track');
      const el = track?.querySelector<HTMLElement>('.stack-thumb.active');
      if (!track || !el) return;
      if (track.scrollHeight > track.clientHeight + 1) {
        track.scrollTo({
          top: el.offsetTop - track.clientHeight / 2 + el.clientHeight / 2,
          behavior: 'smooth',
        });
      } else if (track.scrollWidth > track.clientWidth + 1) {
        track.scrollTo({
          left: el.offsetLeft - track.clientWidth / 2 + el.clientWidth / 2,
          behavior: 'smooth',
        });
      }
    }, 60);
  }

  onScrollerWheel(event: WheelEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (el.scrollHeight <= el.clientHeight + 1) return;
    const atTop = el.scrollTop <= 0 && event.deltaY < 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && event.deltaY > 0;
    if (atTop || atBottom) return;
    el.scrollTop += event.deltaY;
    event.preventDefault();
  }

  /* ============================================================
     ENLARGED VIEWER (double click / double tap)
     ============================================================ */

  openLightbox(): void {
    if (this.expanded || this.videoPlaying || !this.images.length) return;
    this.zoom = 100;
    this.resetPan();
    this.expanded = true;
    this.lockScroll(true);
  }

  closeLightbox(): void {
    if (!this.expanded) return;
    this.expanded = false;
    this.zoom = 100;
    this.resetPan();
    if (!this.modalOpen) this.lockScroll(false);
    this.revealActiveThumb();
  }

  /** Double click / double tap: opens the enlarged viewer, or toggles zoom inside it. */
  private onDoubleTap(): void {
    if (this.expanded) this.toggleZoom();
    else this.openLightbox();
  }

  /* ============================================================
     ZOOM + PAN
     ============================================================ */

  zoomLevels = [60, 100, 150, 200];
  zoom = 100;
  panX = 0;
  panY = 0;
  dragging = false;
  private drag?: { x: number; y: number; px: number; py: number };
  private lastTap = { t: 0, x: 0, y: 0 };

  get zoomTransform(): string {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom / 100})`;
  }

  setZoom(z: number): void {
    this.zoom = z;
    this.clampPan();
  }
  toggleZoom(): void {
    this.setZoom(this.zoom >= 150 ? 100 : 200);
  }
  resetPan(): void {
    this.panX = 0;
    this.panY = 0;
  }

  onStageWheel(e: WheelEvent): void {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const i = this.zoomLevels.indexOf(this.zoom);
    this.setZoom(
      this.zoomLevels[
        Math.min(this.zoomLevels.length - 1, Math.max(0, i + (e.deltaY < 0 ? 1 : -1)))
      ],
    );
  }

  private clampPan(): void {
    // The enlarged viewer is moved to <body>, so look inside it when it is open.
    const root = this.expanded ? this.lightRoot?.nativeElement : this.host.nativeElement;
    const stage = root?.querySelector<HTMLElement>('.image-wrapper');
    const img = root?.querySelector<HTMLElement>('.car-img');
    if (!stage || !img || this.zoom <= 100) {
      this.resetPan();
      return;
    }
    const mx = Math.max(0, ((img.offsetWidth * this.zoom) / 100 - stage.clientWidth) / 2);
    const my = Math.max(0, ((img.offsetHeight * this.zoom) / 100 - stage.clientHeight) / 2);
    this.panX = Math.min(mx, Math.max(-mx, this.panX));
    this.panY = Math.min(my, Math.max(-my, this.panY));
  }

  onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.drag = { x: e.clientX, y: e.clientY, px: this.panX, py: this.panY };
    this.dragging = this.zoom > 100;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.drag || this.zoom <= 100) return;
    this.panX = this.drag.px + (e.clientX - this.drag.x);
    this.panY = this.drag.py + (e.clientY - this.drag.y);
    this.clampPan();
  }

  onPointerUp(e: PointerEvent): void {
    const d = this.drag;
    this.drag = undefined;
    this.dragging = false;
    if (!d) return;

    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;

    // Double click (mouse) and double tap (touch) share one detector so both work on every device.
    if (e.type === 'pointerup' && Math.hypot(dx, dy) < 10) {
      const now = Date.now();
      const isDouble =
        now - this.lastTap.t < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - this.lastTap.x, e.clientY - this.lastTap.y) < DOUBLE_TAP_PX;
      this.lastTap = isDouble ? { t: 0, x: 0, y: 0 } : { t: now, x: e.clientX, y: e.clientY };
      if (isDouble) {
        this.onDoubleTap();
        return;
      }
    }

    if (this.zoom > 100) return;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? this.next() : this.prev();
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    if (!this.modalOpen && !this.videoPlaying) this.next();
  }
  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    if (!this.modalOpen && !this.videoPlaying) this.prev();
  }

  /* ============================================================
     REVIEW VIDEO
     ============================================================ */

  videoPlaying = false;
  vLoading = false;
  vError = false;
  vPaused = false;
  vMuted = false;
  vProgress = 0;
  vCur = '0:00';
  vDur = '0:00';

  /* --- URL helpers ------------------------------------------------- */

  private static readonly FILE_RE = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

  /** Returns a direct-file URL (for <video>) or null. */
  private get fileUrl(): string | null {
    return this.reviewVid && Specs.FILE_RE.test(this.reviewVid) ? this.reviewVid : null;
  }

  /**
   * Returns an embed URL for <iframe> (YouTube / Vimeo / Streamable) or null.
   */
  get embedUrl(): string | null {
    const u = this.reviewVid;
    if (!u || this.fileUrl) return null;

    // YouTube: watch, short, or already-embed
    const yt = u.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([\w-]{11})/,
    );
    if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`;

    // Vimeo
    const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;

    // Streamable — accepts /e/xyz, /xyz, and full page URLs
    const sm = u.match(/streamable\.com\/(?:e\/)?([a-z0-9]+)/i);
    if (sm) return `https://streamable.com/e/${sm[1]}`;

    return null;
  }

  get isIframeVideo(): boolean {
    return this.embedUrl !== null;
  }
  get isFileVideo(): boolean {
    return this.fileUrl !== null;
  }
  get videoSource(): string {
    return this.fileUrl ?? '';
  }

  get hasReview(): boolean {
    return this.isFileVideo || this.isIframeVideo;
  }

  /* --- Playback control ------------------------------------------- */

  openVideo(event: Event): void {
    event.stopPropagation();
    if (!this.hasReview) return;
    this.vPaused = false;
    this.vMuted = false;
    this.vProgress = 0;
    this.vCur = '0:00';
    this.vDur = '0:00';
    this.vError = false;
    // Only the native <video> needs a loader; the iframe shows its own.
    this.vLoading = this.isFileVideo;
    this.videoPlaying = true;
  }

  closeVideo(): void {
    this.videoPlaying = false;
    this.vLoading = false;
    this.vError = false;
    this.vPaused = false;
    this.vMuted = false;
    this.vProgress = 0;
    this.vCur = '0:00';
    this.vDur = '0:00';
  }

  onVideoReady(v: HTMLVideoElement): void {
    // Ignore if we flipped to iframe mode mid-session
    if (!this.isFileVideo) return;
    this.vLoading = false;
    this.vError = false;
    this.vPaused = v.paused;
    this.onVideoTime(v);
  }

  onVideoError(): void {
    if (!this.isFileVideo) return;
    this.vLoading = false;
    this.vError = true;
  }

  retryVideo(v: HTMLVideoElement): void {
    if (!this.isFileVideo) return;
    this.vError = false;
    this.vLoading = true;
    v.load();
    v.play().catch(() => {
      /* autoplay blocked */
    });
  }

  private fmt(s: number): string {
    if (!isFinite(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  onVideoTime(v: HTMLVideoElement): void {
    if (!this.isFileVideo) return;
    this.vCur = this.fmt(v.currentTime);
    this.vDur = this.fmt(v.duration);
    this.vProgress = v.duration ? Math.round((v.currentTime / v.duration) * 1000) : 0;
  }

  toggleVideo(v: HTMLVideoElement): void {
    v.paused ? v.play() : v.pause();
  }
  seekVideo(v: HTMLVideoElement, e: Event): void {
    const val = +(e.target as HTMLInputElement).value;
    if (v.duration) v.currentTime = (v.duration * val) / 1000;
  }
  toggleMute(v: HTMLVideoElement): void {
    v.muted = !v.muted;
    this.vMuted = v.muted;
  }
  fullscreenVideo(v: HTMLVideoElement): void {
    v.requestFullscreen?.().catch(() => {});
  }

  /** Fullscreen for iframe path — try the wrapping element. */
  fullscreenIframe(): void {
    const wrap = this.host.nativeElement.querySelector<HTMLElement>('.iframe-wrap');
    wrap?.requestFullscreen?.().catch(() => {});
  }

  /* ============================================================
     INTEREST MODAL
     ============================================================ */

  phoneImg = 'call.png';
  whatsappImg = 'whatsapp.png';
  youtubeImg = 'youtube.png';
  phoneTel = '+254707555666';
  whatsappNumber = '254707555666';

  modalOpen = false;
  submitted = false;
  attempted = false;
  /** True while the inquiry request is in flight (disable the submit button with this). */
  submitting = false;
  /** Message to show in the modal when the request fails. Empty when there is no error. */
  submitError = '';
  shareLabel = 'Share car link';

  inquiry: { name: string; price: string; id?: string } | null = null;
  get modalName(): string {
    return this.inquiry?.name ?? this.carName;
  }
  get modalPrice(): string {
    return this.inquiry?.price ?? this.carPrice;
  }

  timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  minDate = new Date().toLocaleDateString('en-CA');
  form = this.emptyForm();

  private emptyForm() {
    return {
      name: '',
      phone: '',
      schedule: false,
      date: '',
      time: '10:00',
      tradeIn: false,
      tradeMake: '',
      tradeYear: '',
      tradeMileage: '',
    };
  }

  get nameValid(): boolean {
    return this.form.name.trim().length >= 2;
  }
  get phoneValid(): boolean {
    return /^\+?[\d\s-]{9,16}$/.test(this.form.phone.trim());
  }
  get dateValid(): boolean {
    return !this.form.schedule || !!this.form.date;
  }
  get tradeValid(): boolean {
    return !this.form.tradeIn || this.form.tradeMake.trim().length >= 2;
  }
  get formValid(): boolean {
    return this.nameValid && this.phoneValid && this.dateValid && this.tradeValid;
  }

  get waLink(): string {
    const f = this.form;
    const lines = [
      `Hello A Plus Motors, I'm interested in the ${this.modalName} (${this.modalPrice}).`,
      `Name: ${f.name.trim()}`,
      `Phone: ${f.phone.trim()}`,
    ];
    if (f.schedule) lines.push(`Viewing: ${f.date} at ${f.time}`);
    if (f.tradeIn) {
      const extra = [f.tradeYear.trim(), f.tradeMileage.trim() ? f.tradeMileage.trim() + ' km' : '']
        .filter(Boolean)
        .join(', ');
      lines.push(`Trade-in: ${f.tradeMake.trim()}${extra ? ' (' + extra + ')' : ''}`);
    }
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  openModal(car?: { name: string; price: string; id?: string }): void {
    this.inquiry = car ?? null;
    this.submitError = '';
    if (this.submitted) {
      this.form = this.emptyForm();
      this.submitted = false;
      this.attempted = false;
    }
    this.modalOpen = true;
    this.lockScroll(true);
    setTimeout(
      () => this.modalRoot?.nativeElement.querySelector<HTMLInputElement>('input')?.focus(),
      450,
    );
  }

  closeModal(): void {
    if (!this.modalOpen) return;
    this.modalOpen = false;
    this.submitError = '';
    this.lockScroll(false);
  }
  submitInterest(): void {
    this.attempted = true;
    if (!this.formValid || this.submitting) return;

    const f = this.form;
    const payload: InquiryRequestPayload = {
      name: f.name.trim(),
      phone: f.phone.trim(),
      carId: this.inquiry?.id ?? this.car?._id,
      carName: this.modalName,
      price: this.modalPrice,
      schedule: f.schedule,
      viewingDate: f.schedule ? f.date : undefined,
      viewingTime: f.schedule ? f.time : undefined,
      tradeIn: f.tradeIn,
      tradeMake: f.tradeIn ? f.tradeMake.trim() : undefined,
      tradeYear: f.tradeIn ? f.tradeYear.trim() : undefined,
      tradeMileage: f.tradeIn ? f.tradeMileage.trim() : undefined,
    };

    this.submitting = true;
    this.submitError = '';
    this.submitSub?.unsubscribe();
    this.submitSub = this.api.submitInquiry(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.modalRoot?.nativeElement.querySelector('.im-scroll')?.scrollTo({ top: 0 });
      },
      error: (err) => {
        this.submitting = false;
        this.submitError =
          err?.error?.message ||
          'We could not send your request. Please try again, or reach us on WhatsApp.';
      },
    });
  }

  private carLink(id: string): string {
    const tree = this.router.createUrlTree(['/specs'], { queryParams: { id } });
    return window.location.origin + this.location.prepareExternalUrl(this.router.serializeUrl(tree));
  }
  private shareMessage(name: string, price: string, url: string): string {
    return `${name} · ${price} — A Plus Motors\n${url}`;
  }

  async shareCar(): Promise<void> {
    // The car in the modal (a similar car if that is what was clicked), not just this page.
    const id = this.inquiry?.id ?? this.car?._id;
    const url = id ? this.carLink(id) : window.location.href;
    const message = this.shareMessage(this.modalName, this.modalPrice, url);
    try {
      if (navigator.share) {
        // The link is inside the text so every app (WhatsApp, SMS, ...) gets it.
        await navigator.share({ title: this.modalName, text: message });
        return;
      }
      await navigator.clipboard.writeText(message);
      this.shareLabel = 'Link copied';
      setTimeout(() => (this.shareLabel = 'Share car link'), 2000);
    } catch {
      /* dismissed or blocked */
    }
  }

  goModal(route: string): void {
    this.closeModal();
    this.leaveAndGo([route]);
  }

  /* ============================================================
     SIMILAR-CAR ACTIONS
     ============================================================ */

  /* --- Hover review video on the similar cars (same as the portfolio) --- */
  hoveredId: string | null = null;
  private supportsHover = true;
  private previewFailed = new Set<string>();

  hasPreview(car: SimilarCar): boolean {
    return !!car.preview && !this.previewFailed.has(car.id);
  }
  onCardEnter(car: SimilarCar): void {
    if (!this.supportsHover || !this.hasPreview(car)) return;
    this.hoveredId = car.id;
  }
  onCardLeave(car: SimilarCar): void {
    if (this.hoveredId === car.id) this.hoveredId = null;
  }
  onPreviewCanPlay(el: HTMLVideoElement): void {
    primeMutedVideo(el);
  }
  onPreviewReady(el: HTMLElement): void {
    markReady(el);
  }
  /** A video that can't be played puts that card back to image-only. */
  onPreviewError(car: SimilarCar): void {
    this.previewFailed.add(car.id);
    if (this.hoveredId === car.id) this.hoveredId = null;
  }

  liked = new Set<string>();
  saved = new Set<string>();
  copiedId: string | null = null;

  private toggle(set: Set<string>, id: string): void {
    set.has(id) ? set.delete(id) : set.add(id);
  }

  likeCar(car: SimilarCar, e: Event): void {
    e.stopPropagation();
    this.toggle(this.liked, car.id);
  }
  bookmarkCar(car: SimilarCar, e: Event): void {
    e.stopPropagation();
    this.toggle(this.saved, car.id);
  }

  async shareCarItem(car: SimilarCar, e: Event): Promise<void> {
    e.stopPropagation();
    const url = this.carLink(car.id);
    const message = this.shareMessage(`${car.year} ${car.brand} ${car.name}`, car.price, url);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${car.brand} ${car.name}`, text: message });
        return;
      }
      await navigator.clipboard.writeText(message);
      this.copiedId = car.id;
      setTimeout(() => (this.copiedId = null), 2000);
    } catch {
      /* dismissed or blocked */
    }
  }

  inquireCar(car: SimilarCar, e: Event): void {
    e.stopPropagation();
    this.openModal({ name: `${car.brand} ${car.name}`, price: car.price, id: car.id });
  }

  openSimilar(car: SimilarCar, e?: Event): void {
    e?.stopPropagation();
    this.router.navigate(['/specs'], { queryParams: { id: car.id } });
  }

  /* ============================================================
     ESC / SCROLL
     ============================================================ */

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalOpen) this.closeModal();
    else if (this.expanded) this.closeLightbox();
    else if (this.videoPlaying) this.closeVideo();
  }

  private lockScroll(lock: boolean): void {
    document.body.style.overflow = lock ? 'hidden' : '';
    ScrollSmoother.get()?.paused(lock);
  }


  private imgIo?: IntersectionObserver;
  private imgSafetyTimer?: ReturnType<typeof setTimeout>;

  private loadLazyImg(img: HTMLImageElement): void {
    const src = img.dataset['src'];
    if (!src || img.getAttribute('src')) return;
    img.src = src;
  }

  private observeCardImages(): void {
    this.imgIo?.disconnect();
    if (this.imgSafetyTimer) clearTimeout(this.imgSafetyTimer);
    const imgs = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLImageElement>('img[data-src]'),
    ).filter((i) => !i.getAttribute('src'));
    if (!imgs.length) return;
    if (!('IntersectionObserver' in window)) {
      imgs.forEach((i) => this.loadLazyImg(i));
      return;
    }

    this.imgIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          this.loadLazyImg(en.target as HTMLImageElement);
          this.imgIo?.unobserve(en.target);
        });
      },
      { rootMargin: '600px 0px' },
    );
    imgs.forEach((i) => this.imgIo!.observe(i));

    this.imgSafetyTimer = setTimeout(() => imgs.forEach((i) => this.loadLazyImg(i)), 3000);
  }

  onCardImgLoad(e: Event): void {
    (e.target as HTMLElement).closest('.car-image-wrapper')?.classList.add('loaded');
  }

  onCardImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    const wrap = img.closest('.car-image-wrapper');
    if (!img.getAttribute('src')) return;
    if (img.dataset['retried'] !== '1') {
      img.dataset['retried'] = '1';
      const base = img.dataset['src'] ?? '';
      setTimeout(() => {
        img.src = base + (base.includes('?') ? '&' : '?') + 'r=' + Date.now();
      }, 600);
      return;
    }
    wrap?.classList.add('failed');
  }

  /* ============================================================
     ROAD ANIMATION
     ============================================================ */

  private roadTween?: gsap.core.Tween;

  private startRoad(): void {
    if (this.roadTween) return;
    const root = this.host.nativeElement;
    const road = root.querySelector<HTMLElement>('.sim-road');
    const car = root.querySelector<HTMLElement>('.sim-road i');
    const items = Array.from(root.querySelectorAll<HTMLElement>('.sim-label, .sim-criteria li'));
    const lightAll = () => items.forEach((el) => el.classList.add('lit'));

    if (!road || !car || this.reducedMotion) {
      lightAll();
      return;
    }

    const carW = 38;
    let pending = items.slice();

    this.roadTween = gsap.fromTo(
      car,
      { x: -carW - 20 },
      {
        x: road.clientWidth + 20,
        duration: Math.max(5, road.clientWidth / 130),
        ease: 'none',
        repeat: -1,
        onUpdate: () => {
          if (!pending.length) return;
          const x = gsap.getProperty(car, 'x') as number;
          const roadLeft = road.getBoundingClientRect().left;
          pending = pending.filter((el) => {
            const elLeft = el.getBoundingClientRect().left - roadLeft;
            if (elLeft < x + carW * 0.6) {
              el.classList.add('lit');
              return false;
            }
            return true;
          });
        },
      },
    );
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.supportsHover = canHover() && !prefersReducedMotion();
    this.jumpToTop();
    document.body.appendChild(this.modalRoot.nativeElement);
    document.body.appendChild(this.lightRoot.nativeElement);
    this.scheduleCardImages();
    this.startRoad();
    this.playEnter();
  }

  private get panels(): Element[] {
    return Array.from(this.host.nativeElement.querySelectorAll('.hero-page, .similar-section'));
  }

  private ctx?: gsap.Context;

  private playEnter(): void {
    if (this.reducedMotion) return;
    const root = this.host.nativeElement;
    this.ctx ??= gsap.context(() => {}, root);
    this.ctx.add(() => {
      gsap.fromTo(
        '.specs-box, .car-section, .gallery-col, .similar-section .car-card',
        { opacity: 0, x: MOTION.enterX, scale: MOTION.enterScale },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: MOTION.enterDuration,
          ease: MOTION.enterEase,
          stagger: MOTION.enterStagger,
          clearProps: 'opacity,transform',
        },
      );
    });
  }

  private leavePromise?: Promise<void>;

  playLeave(): Promise<void> {
    if (this.reducedMotion) return Promise.resolve();
    if (!this.leavePromise) {
      this.leavePromise = new Promise((resolve) => {
        gsap.to(this.panels, {
          opacity: 0,
          y: MOTION.leaveOffset,
          duration: MOTION.leaveDuration,
          ease: MOTION.leaveEase,
          onComplete: () => resolve(),
        });
      });
    }
    return this.leavePromise;
  }

  private async leaveAndGo(commands: any[]): Promise<void> {
    await this.playLeave();
    const navigated = await this.router.navigate(commands);
    if (!navigated) {
      this.leavePromise = undefined;
      gsap.to(this.panels, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      });
    }
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    this.submitSub?.unsubscribe();
    this.imgIo?.disconnect();
    if (this.imgSafetyTimer) clearTimeout(this.imgSafetyTimer);
    this.roadTween?.kill();
    gsap.killTweensOf(this.panels);
    this.ctx?.revert();
    this.modalRoot?.nativeElement.remove();
    this.lightRoot?.nativeElement.remove();
    this.lockScroll(false);
  }

  goTo(route: string): void {
    this.leaveAndGo([route]);
  }
  goToMainStore(): void {
    this.goTo('/store');
    this.location.back();
  }
  goToContact(): void {
    this.goTo('/contact');
  }
  goToSpecs(): void {
    this.goTo('/specs');
  }
}

export const specsLeaveGuard: CanDeactivateFn<Specs> = (component) =>
  component.playLeave().then(() => true);