// src/app/home/portfolio/specs/specs.ts
import {
  Component, ElementRef, AfterViewInit, OnDestroy, ViewChild, HostListener, inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, CanDeactivateFn } from '@angular/router';
import { Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ApiServices, ksh } from '../../../services/api-services';
import { ApiCar } from '../../../interfaces/car-interface';

type CarView = 'exterior' | 'interior';
interface SpecRow { label: string; value: string; }
interface SpecGroup { title: string; rows: SpecRow[]; }
interface SimilarCar {
  id: string; name: string; brand: string; year: string;
  price: string; meta: string; why: string; image: string;
}

/** Normalise body strings from the API ("SUV", "Pickup", "Hatchback", …) into buckets. */
type BodyBucket = 'suv' | 'truck' | 'van' | 'coupe' | 'hatchback' | 'sedan' | 'other';

@Component({
  selector: 'app-specs',
  templateUrl: './specs.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./specs.css'],
  host: { style: 'overflow: clip' }
})
export class Specs implements AfterViewInit, OnDestroy {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiServices
  ) {
    this.jumpToTop();
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => this.loadCar(params.get('id')));
  }

  private location = inject(Location);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('modalRoot') modalRoot!: ElementRef<HTMLElement>;

  private viewReady = false;
  private loadSub?: Subscription;

  private jumpToTop(): void {
    ScrollSmoother.get()?.scrollTo(0, false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
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

  /** True when the API says financing is actually enabled for this car. */
  get financingEnabled(): boolean {
    return !!(this.car?.financing && this.car?.finance?.enabled);
  }

  /** Text shown in finance chips (left panel + interest modal). */
  get financingLabel(): string {
    return this.financingEnabled ? 'Financing available' : 'Financing on request';
  }

  views: CarView[] = ['exterior', 'interior'];

  exteriorSpecs: SpecGroup[] = [];
  interiorSpecs: SpecGroup[] = [];

  exteriorImages: string[] = [];
  interiorImages: string[] = [];

  reviewVid = '';

  pickCriteria = ['Same brand or class', 'Similar body style', 'Comparable price', 'Close model year'];

  similarVehicles: SimilarCar[] = [];

  footerLinks = [
    { label: 'Explore our financing', route: '/financing' },
    { label: 'Import a car', route: '/import' },
    { label: 'Trade in', route: '/trade-in' },
    { label: 'Contact us', route: '/contact' },
    { label: 'Sell your car', route: '/sell' },
    { label: 'Book a test drive', route: '/test-drive' }
  ];

  private loadCar(id: string | null): void {
    this.loading = true;
    this.notFound = false;
    this.loadSub?.unsubscribe();
    this.loadSub = this.api.getAllCars().subscribe({
      next: all => {
        const web = all.filter(c => c.showOnWeb);
        const car = id
          ? (all.find(c => c._id === id) ?? web.find(c => c.recommended) ?? web[0])
          : (web.find(c => c.recommended) ?? web[0] ?? all[0]);

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
      }
    });
  }

  private applyCar(c: ApiCar, pool: ApiCar[]): void {
    this.notFound = false;
    this.car = c;
    this.seriesName = `${c.make} ${c.model}`;
    this.carName = `${c.year} ${c.make} ${c.model}`;
    this.carPrice = ksh(c.price);

    const photos = Array.from(new Set((c.photos ?? []).filter(Boolean)));
    this.exteriorImages = photos;
    this.interiorImages = photos;
    this.reviewVid = (c.reviewVideoUrl ?? '').trim();

    this.exteriorSpecs = this.buildExterior(c);
    this.interiorSpecs = this.buildInterior(c);
    this.similarVehicles = this.buildSimilar(c, pool);

    this.view = 'exterior';
    this.activeIndex = 0;
    this.stackExpanded = false;
    this.videoPlaying = false;
    this.zoom = 100;
    this.resetPan();

    if (this.viewReady) {
      this.jumpToTop();
      setTimeout(() => {
        this.observeReveals();
        this.observeCardImages();
      }, 0);
    }
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
          { label: 'Drivetrain', value: c.drive }
        ]
      },
      {
        title: 'Vehicle',
        rows: [
          { label: 'Body', value: c.body },
          { label: 'Colour', value: c.colour },
          { label: 'Year', value: c.year ? String(c.year) : '' },
          { label: 'Mileage', value: this.num(c.mileage, ' km') }
        ]
      },
      {
        title: 'Pricing',
        rows: [
          { label: 'Price', value: ksh(c.price) },
          { label: 'Negotiable', value: c.negotiable ? 'Yes' : 'No' },
          { label: 'Financing', value: this.financingEnabled ? 'Available' : 'On request' }
        ]
      },
      {
        title: 'Listing',
        rows: [
          { label: 'Stock no', value: c.stockNo },
          { label: 'Branch', value: c.branch },
          { label: 'Source', value: c.source },
          { label: 'VIN', value: c.vin }
        ]
      }
    ];

    return groups
      .map(g => ({ ...g, rows: g.rows.filter(r => this.hasValue(r.value)) }))
      .filter(g => g.rows.length > 0);
  }

  private buildInterior(c: ApiCar): SpecGroup[] {
    const groups: SpecGroup[] = [];

    const features = (c.features ?? []).filter(Boolean);
    if (features.length) {
      groups.push({
        title: 'Features',
        rows: features.map(f => ({ label: f, value: 'Included' }))
      });
    }

    if (this.financingEnabled && c.finance) {
      const f = c.finance;
      const partner =
        f.bankDetails?.[0]?.fullName ??
        f.bankFullName ??
        f.primaryBank ??
        f.banks?.[0];

      const financeRows: SpecRow[] = [
        { label: 'Partner', value: partner ?? '' },
        { label: 'Rate', value: f.rate != null ? `${f.rate}%` : '' },
        { label: 'Deposit', value: f.deposit != null ? `${f.deposit}%` : '' },
        { label: 'Term', value: f.term != null ? `${f.term} months` : '' },
        { label: 'Max financed', value: f.maxAmount != null ? ksh(f.maxAmount) : '' },
        { label: 'Est. monthly', value: f.monthly != null ? ksh(f.monthly) : '' }
      ].filter(r => this.hasValue(r.value));

      if (financeRows.length) {
        groups.push({ title: 'Finance', rows: financeRows });
      }
    } else if (c.financing === false || c.finance?.enabled === false) {
      groups.push({
        title: 'Finance',
        rows: [{ label: 'Financing', value: 'On request' }]
      });
    }

    if (c.notes?.trim()) {
      groups.push({
        title: 'Notes',
        rows: [{ label: 'Details', value: c.notes.trim() }]
      });
    }

    return groups;
  }

  private buildSimilar(c: ApiCar, pool: ApiCar[]): SimilarCar[] {
    const targetBody = this.bucket(c.body);
    const scored = pool
      .filter(o => o._id !== c._id)
      .map(o => {
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
      .filter(x => x.score > 0)
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
      image: o.photos?.[0] ?? ''
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
  activeIndex = 0;
  stackExpanded = false;

  get images(): string[] {
    return this.view === 'exterior' ? this.exteriorImages : this.interiorImages;
  }
  get activeSpecs(): SpecGroup[] {
    return this.view === 'exterior' ? this.exteriorSpecs : this.interiorSpecs;
  }
  get activeImage(): string {
    return this.images[this.activeIndex] ?? '';
  }

  /* ---- Image trim ---- */
  private trimmed = new Map<string, string>();
  private tried = new Set<string>();

  get displayImage(): string {
    return this.trimmed.get(this.activeImage) ?? this.activeImage;
  }

  trimImage(e: Event): void {
    const img = e.target as HTMLImageElement;
    const src = this.activeImage;
    this.clampPan();
    if (this.tried.has(src) || !img.naturalWidth) return;
    this.tried.add(src);
    try {
      const W = img.naturalWidth, H = img.naturalHeight;
      const k = Math.min(1, 600 / Math.max(W, H));
      const sw = Math.max(1, Math.round(W * k)), sh = Math.max(1, Math.round(H * k));
      const probe = document.createElement('canvas');
      probe.width = sw; probe.height = sh;
      const pctx = probe.getContext('2d')!;
      pctx.drawImage(img, 0, 0, sw, sh);
      const data = pctx.getImageData(0, 0, sw, sh).data;
      let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        if (data[(y * sw + x) * 4 + 3] > 12) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
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
      out.width = cw; out.height = ch;
      out.getContext('2d')!.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
      this.trimmed.set(src, out.toDataURL('image/png'));
    } catch { /* cross-origin: keep original */ }
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
  selectImage(i: number): void { this.activeIndex = i; this.afterNav(); }
  toggleStack(): void { this.stackExpanded = !this.stackExpanded; this.revealActiveThumb(); }

  private afterNav(): void {
    this.videoPlaying = false;
    this.resetPan();
    this.revealActiveThumb();
  }

  private revealActiveThumb(): void {
    setTimeout(() => {
      const track = this.host.nativeElement.querySelector<HTMLElement>('.stack-track');
      const el = track?.querySelector<HTMLElement>('.stack-thumb.active');
      if (!track || !el) return;
      if (track.scrollHeight > track.clientHeight + 1) {
        track.scrollTo({ top: el.offsetTop - track.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
      } else if (track.scrollWidth > track.clientWidth + 1) {
        track.scrollTo({ left: el.offsetLeft - track.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
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
     ZOOM + PAN
     ============================================================ */

  zoomLevels = [60, 100, 150, 200];
  zoom = 100;
  panX = 0;
  panY = 0;
  dragging = false;
  private drag?: { x: number; y: number; px: number; py: number };

  get zoomTransform(): string {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom / 100})`;
  }

  setZoom(z: number): void { this.zoom = z; this.clampPan(); }
  toggleZoom(): void { this.setZoom(this.zoom >= 150 ? 100 : 200); }
  resetPan(): void { this.panX = 0; this.panY = 0; }

  onStageWheel(e: WheelEvent): void {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const i = this.zoomLevels.indexOf(this.zoom);
    this.setZoom(this.zoomLevels[Math.min(this.zoomLevels.length - 1, Math.max(0, i + (e.deltaY < 0 ? 1 : -1)))]);
  }

  private clampPan(): void {
    const stage = this.host.nativeElement.querySelector<HTMLElement>('.image-wrapper');
    const img = this.host.nativeElement.querySelector<HTMLElement>('.car-img');
    if (!stage || !img || this.zoom <= 100) { this.resetPan(); return; }
    const mx = Math.max(0, (img.offsetWidth * this.zoom / 100 - stage.clientWidth) / 2);
    const my = Math.max(0, (img.offsetHeight * this.zoom / 100 - stage.clientHeight) / 2);
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
    if (!d || this.zoom > 100) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? this.next() : this.prev();
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void { if (!this.modalOpen && !this.videoPlaying) this.next(); }
  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void { if (!this.modalOpen && !this.videoPlaying) this.prev(); }

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

  get hasReview(): boolean { return !!this.reviewVid; }

  openVideo(event: Event): void {
    event.stopPropagation();
    if (!this.reviewVid) return;
    this.vPaused = false;
    this.vMuted = false;
    this.vProgress = 0;
    this.vCur = '0:00';
    this.vDur = '0:00';
    this.vLoading = true;
    this.vError = false;
    this.videoPlaying = true;
  }

  closeVideo(): void {
    this.videoPlaying = false;
    this.vLoading = false;
    this.vError = false;
  }

  onVideoReady(v: HTMLVideoElement): void {
    this.vLoading = false;
    this.vError = false;
    this.vPaused = v.paused;
    this.onVideoTime(v);
  }
  onVideoError(): void { this.vLoading = false; this.vError = true; }
  retryVideo(v: HTMLVideoElement): void {
    this.vError = false;
    this.vLoading = true;
    v.load();
    v.play().catch(() => { /* autoplay blocked */ });
  }

  private fmt(s: number): string {
    if (!isFinite(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }
  onVideoTime(v: HTMLVideoElement): void {
    this.vCur = this.fmt(v.currentTime);
    this.vDur = this.fmt(v.duration);
    this.vProgress = v.duration ? Math.round((v.currentTime / v.duration) * 1000) : 0;
  }
  toggleVideo(v: HTMLVideoElement): void { v.paused ? v.play() : v.pause(); }
  seekVideo(v: HTMLVideoElement, e: Event): void {
    const val = +(e.target as HTMLInputElement).value;
    if (v.duration) v.currentTime = (v.duration * val) / 1000;
  }
  toggleMute(v: HTMLVideoElement): void { v.muted = !v.muted; this.vMuted = v.muted; }
  fullscreenVideo(v: HTMLVideoElement): void { v.requestFullscreen?.().catch(() => {}); }

  /* ============================================================
     INTEREST MODAL
     ============================================================ */

  logoImg = 'fav3.png';
  phoneImg = 'call.png';
  whatsappImg = 'whatsapp.png';
  youtubeImg = 'youtube.png';
  phoneTel = '+254707555666';
  whatsappNumber = '254707555666';

  modalOpen = false;
  submitted = false;
  attempted = false;
  shareLabel = 'Share car link';

  inquiry: { name: string; price: string } | null = null;
  get modalName(): string { return this.inquiry?.name ?? this.carName; }
  get modalPrice(): string { return this.inquiry?.price ?? this.carPrice; }

  timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  minDate = new Date().toLocaleDateString('en-CA');
  form = this.emptyForm();

  private emptyForm() {
    return {
      name: '', phone: '', schedule: false, date: '', time: '10:00',
      tradeIn: false, tradeMake: '', tradeYear: '', tradeMileage: ''
    };
  }

  get nameValid(): boolean { return this.form.name.trim().length >= 2; }
  get phoneValid(): boolean { return /^\+?[\d\s-]{9,16}$/.test(this.form.phone.trim()); }
  get dateValid(): boolean { return !this.form.schedule || !!this.form.date; }
  get tradeValid(): boolean { return !this.form.tradeIn || this.form.tradeMake.trim().length >= 2; }
  get formValid(): boolean { return this.nameValid && this.phoneValid && this.dateValid && this.tradeValid; }

  get waLink(): string {
    const f = this.form;
    const lines = [
      `Hello A Plus Motors, I'm interested in the ${this.modalName} (${this.modalPrice}).`,
      `Name: ${f.name.trim()}`,
      `Phone: ${f.phone.trim()}`
    ];
    if (f.schedule) lines.push(`Viewing: ${f.date} at ${f.time}`);
    if (f.tradeIn) {
      const extra = [f.tradeYear.trim(), f.tradeMileage.trim() ? f.tradeMileage.trim() + ' km' : '']
        .filter(Boolean).join(', ');
      lines.push(`Trade-in: ${f.tradeMake.trim()}${extra ? ' (' + extra + ')' : ''}`);
    }
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  openModal(car?: { name: string; price: string }): void {
    this.inquiry = car ?? null;
    if (this.submitted) {
      this.form = this.emptyForm();
      this.submitted = false;
      this.attempted = false;
    }
    this.modalOpen = true;
    this.lockScroll(true);
    setTimeout(
      () => this.modalRoot?.nativeElement.querySelector<HTMLInputElement>('input')?.focus(),
      450
    );
  }

  closeModal(): void {
    if (!this.modalOpen) return;
    this.modalOpen = false;
    this.lockScroll(false);
  }

  submitInterest(): void {
    this.attempted = true;
    if (!this.formValid) return;
    this.submitted = true;
    this.modalRoot?.nativeElement.querySelector('.im-scroll')?.scrollTo({ top: 0 });
  }

  async shareCar(): Promise<void> {
    const url = window.location.href;
    const data = {
      title: this.modalName,
      text: `${this.modalName} · ${this.modalPrice} — A Plus Motors`,
      url
    };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      this.shareLabel = 'Link copied';
      setTimeout(() => (this.shareLabel = 'Share car link'), 2000);
    } catch { /* dismissed or blocked */ }
  }

  goModal(route: string): void { this.closeModal(); this.leaveAndGo([route]); }

  /* ============================================================
     SIMILAR-CAR ACTIONS
     ============================================================ */

  liked = new Set<string>();
  saved = new Set<string>();
  copiedId: string | null = null;

  private toggle(set: Set<string>, id: string): void {
    set.has(id) ? set.delete(id) : set.add(id);
  }

  likeCar(car: SimilarCar, e: Event): void { e.stopPropagation(); this.toggle(this.liked, car.id); }
  bookmarkCar(car: SimilarCar, e: Event): void { e.stopPropagation(); this.toggle(this.saved, car.id); }

  async shareCarItem(car: SimilarCar, e: Event): Promise<void> {
    e.stopPropagation();
    const tree = this.router.createUrlTree(['/specs'], { queryParams: { id: car.id } });
    const url = window.location.origin + this.location.prepareExternalUrl(this.router.serializeUrl(tree));
    try {
      if (navigator.share) {
        await navigator.share({
          title: car.name,
          text: `Check out this ${car.brand} ${car.name} at A Plus Motors`,
          url
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.copiedId = car.id;
      setTimeout(() => (this.copiedId = null), 2000);
    } catch { /* dismissed or blocked */ }
  }

  inquireCar(car: SimilarCar, e: Event): void {
    e.stopPropagation();
    this.openModal({ name: `${car.brand} ${car.name}`, price: car.price });
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
    else if (this.videoPlaying) this.closeVideo();
  }

  private lockScroll(lock: boolean): void {
    document.body.style.overflow = lock ? 'hidden' : '';
    ScrollSmoother.get()?.paused(lock);
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */

  private io?: IntersectionObserver;

  private observeReveals(): void {
    this.io?.disconnect();
    const els = this.host.nativeElement.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      this.startRoad();
      return;
    }
    this.io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        if (en.target.classList.contains('similar-head')) this.startRoad();
        this.io?.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => this.io!.observe(el));
  }

  /* ============================================================
     LAZY IMAGES
     ============================================================ */

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
    const imgs = Array.from(this.host.nativeElement.querySelectorAll<HTMLImageElement>('img[data-src]'))
      .filter(i => !i.getAttribute('src'));
    if (!('IntersectionObserver' in window)) { imgs.forEach(i => this.loadLazyImg(i)); return; }

    this.imgIo = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        this.loadLazyImg(en.target as HTMLImageElement);
        this.imgIo?.unobserve(en.target);
      });
    }, { rootMargin: '600px 0px' });
    imgs.forEach(i => this.imgIo!.observe(i));

    this.imgSafetyTimer = setTimeout(() => imgs.forEach(i => this.loadLazyImg(i)), 3000);
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
    const lightAll = () => items.forEach(el => el.classList.add('lit'));

    if (!road || !car || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
          pending = pending.filter(el => {
            const elLeft = el.getBoundingClientRect().left - roadLeft;
            if (elLeft < x + carW * 0.6) { el.classList.add('lit'); return false; }
            return true;
          });
        }
      }
    );
  }

  /* ============================================================
     LIFECYCLE
     ============================================================ */

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.jumpToTop();
    document.body.appendChild(this.modalRoot.nativeElement);
    this.observeReveals();
    this.observeCardImages();
    gsap.fromTo(
      this.panels,
      { scale: 1.15, transformOrigin: 'center center' },
      { scale: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform' }
    );
  }

  private get panels(): Element[] {
    return Array.from(this.host.nativeElement.querySelectorAll('.hero-page, .similar-section'));
  }

  private leavePromise?: Promise<void>;

  playLeave(): Promise<void> {
    if (!this.leavePromise) {
      this.leavePromise = new Promise(resolve => {
        gsap.to(this.panels, {
          opacity: 0, scale: 0.96, transformOrigin: 'center center',
          duration: 0.35, ease: 'power2.inOut', onComplete: () => resolve()
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
        opacity: 1, scale: 1, duration: 0.65,
        ease: 'power2.inOut', clearProps: 'opacity,transform'
      });
    }
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    this.io?.disconnect();
    this.imgIo?.disconnect();
    if (this.imgSafetyTimer) clearTimeout(this.imgSafetyTimer);
    this.roadTween?.kill();
    gsap.killTweensOf(this.panels);
    this.modalRoot?.nativeElement.remove();
    this.lockScroll(false);
  }

  async goBack() { await this.playLeave(); this.location.back(); }
  goTo(route: string): void { this.leaveAndGo([route]); }
  goToMainStore(): void { this.goTo('/store'); }
  goToContact(): void { this.goTo('/contact'); }
  goToSpecs(): void { this.goTo('/specs'); }
}

export const specsLeaveGuard: CanDeactivateFn<Specs> = component =>
  component.playLeave().then(() => true);