import {
  Component, ElementRef, AfterViewInit, OnDestroy, ViewChild, HostListener, inject
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, CanDeactivateFn } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

type CarView = 'exterior' | 'interior';
interface SpecRow { label: string; value: string; }
interface SpecGroup { title: string; rows: SpecRow[]; }
interface SimilarCar { id: number; name: string; brand: string; year: string; price: string; meta: string; why: string; image: string; }

@Component({
  selector: 'app-specs',
  templateUrl: './specs.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./specs.css'],
  host: { style: 'overflow: clip' }
})
export class Specs implements AfterViewInit, OnDestroy {
  constructor(private router: Router) { this.jumpToTop(); }

  private location = inject(Location);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('modalRoot') modalRoot!: ElementRef<HTMLElement>;

  private jumpToTop(): void {
    ScrollSmoother.get()?.scrollTo(0, false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }

  // ---------- Car data ----------
  seriesName = 'BMW i4 Series';
  carName = 'BMW i4 eDrive40';
  carPrice = 'Ksh 7,056,395';

  views: CarView[] = ['exterior', 'interior'];

  exteriorSpecs: SpecGroup[] = [
    { title: 'Engine & Performance', rows: [
      { label: 'Powertrain', value: 'Pure electric' },
      { label: 'Horsepower', value: '335 hp' },
      { label: 'Torque', value: '317 lb-ft' },
      { label: '0–60 mph', value: '5.5 s' },
      { label: 'Top speed', value: '118 mph' },
      { label: 'Drivetrain', value: 'Rear-wheel drive' }] },
    { title: 'Battery & Range', rows: [
      { label: 'Battery', value: '83.9 kWh lithium-ion' },
      { label: 'Range', value: '301 mi (EPA)' },
      { label: 'DC fast charge', value: '10–80% in 31 min' },
      { label: 'AC charge', value: '11 kW onboard' }] },
    { title: 'Exterior Dimensions', rows: [
      { label: 'Length', value: '188.5 in' },
      { label: 'Width', value: '72.9 in' },
      { label: 'Height', value: '57.0 in' },
      { label: 'Wheelbase', value: '112.2 in' },
      { label: 'Wheels', value: '18" aero alloy' }] },
    { title: 'Exterior Features', rows: [
      { label: 'Headlights', value: 'Adaptive LED' },
      { label: 'Roof', value: 'Body-colour with sunroof' },
      { label: 'Mirrors', value: 'Heated, power-folding' },
      { label: 'Paint', value: 'Alpine White Metallic' }] }
  ];

  interiorSpecs: SpecGroup[] = [
    { title: 'Comfort & Seating', rows: [
      { label: 'Seats', value: 'Heated, 4-way lumbar' },
      { label: 'Upholstery', value: 'Vernasca leather' },
      { label: 'Front seats', value: 'Power, memory' },
      { label: 'Rear seats', value: '40/20/40 split' }] },
    { title: 'Infotainment', rows: [
      { label: 'Display', value: '12.3" + 14.9" curved' },
      { label: 'System', value: 'BMW OS 8.5' },
      { label: 'Audio', value: 'Harman Kardon 16-speaker' },
      { label: 'Connectivity', value: 'Wireless Apple CarPlay / Android Auto' },
      { label: 'Charging', value: 'Wireless + USB-C' }] },
    { title: 'Cabin Features', rows: [
      { label: 'Climate', value: 'Dual-zone auto' },
      { label: 'Roof', value: 'Panoramic glass' },
      { label: 'Lighting', value: 'Ambient LED' },
      { label: 'Cargo', value: '10.0 cu ft' }] },
    { title: 'Driver Assistance', rows: [
      { label: 'Cruise', value: 'Adaptive with stop & go' },
      { label: 'Parking', value: 'Rear camera + sensors' },
      { label: 'Safety', value: 'Lane keep, blind spot' },
      { label: 'Airbags', value: '8 total' }] }
  ];

  exteriorImages = [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop&q=80',
    '1.png',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=80'
  ];
  interiorImages = ['interior-1.jpg', 'interior-2.jpg', 'interior-3.jpg', 'interior-4.jpg', 'interior-5.jpg', 'interior-6.jpg'];

  reviewVid = '2.mp4';

  /** Criteria shown in the similar-cars header. */
  pickCriteria = ['Electric powertrain', 'Comparable power & range', 'Same brand & generation', 'Similar body style'];

  similarVehicles: SimilarCar[] = [
    { id: 1, name: 'i4 M50', brand: 'BMW', year: '2023', price: 'Ksh 1,367,300', meta: 'Electric · 536 hp · AWD',
      why: 'Same i4 body and platform, with the performance tune.', image: '1.png' },
    { id: 2, name: 'iX xDrive50', brand: 'BMW', year: '2023', price: 'Ksh 1,087,100', meta: 'Electric · 516 hp · SUV',
      why: 'Electric with similar range, in a taller SUV body.',
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80' },
    { id: 3, name: 'i7 xDrive60', brand: 'BMW', year: '2023', price: 'Ksh 2,119,300', meta: 'Electric · 536 hp · Saloon',
      why: 'The flagship step up: same brand, saloon layout, more luxury.',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80' },
    { id: 4, name: 'i5 eDrive40', brand: 'BMW', year: '2024', price: 'Ksh 1,540,000', meta: 'Electric · 335 hp · Saloon',
      why: 'Identical 335 hp output in a roomier saloon.',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80' },
    { id: 5, name: 'iX1 xDrive30', brand: 'BMW', year: '2024', price: 'Ksh 980,000', meta: 'Electric · 313 hp · SUV',
      why: 'Close on power, more compact and practical.',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&auto=format&fit=crop&q=80' },
    { id: 6, name: 'i4 eDrive35', brand: 'BMW', year: '2023', price: 'Ksh 1,250,000', meta: 'Electric · 281 hp · RWD',
      why: 'Same i4 gran coupé with a smaller battery and motor.',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop&q=80' }
  ];

  footerLinks = [
    { label: 'Explore our financing', route: '/financing' },
    { label: 'Import a car', route: '/import' },
    { label: 'Trade in', route: '/trade-in' },
    { label: 'Contact us', route: '/contact' },
    { label: 'Sell your car', route: '/sell' },
    { label: 'Book a test drive', route: '/test-drive' }
  ];

  // ---------- Gallery state ----------
  view: CarView = 'exterior';
  activeIndex = 0;
  stackExpanded = false;

  get images(): string[] { return this.view === 'exterior' ? this.exteriorImages : this.interiorImages; }
  get activeSpecs(): SpecGroup[] { return this.view === 'exterior' ? this.exteriorSpecs : this.interiorSpecs; }
  get activeImage(): string { return this.images[this.activeIndex] ?? ''; }

  // ---------- Trim empty transparent margins so every car fills the same box ----------
  private trimmed = new Map<string, string>();
  private tried = new Set<string>();

  get displayImage(): string { return this.trimmed.get(this.activeImage) ?? this.activeImage; }

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
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > sw * sh * 0.97) return; // nothing worth trimming
      const pad = 0.01;
      const cx = Math.max(0, Math.floor((x0 / sw - pad) * W)), cy = Math.max(0, Math.floor((y0 / sh - pad) * H));
      const cw = Math.min(W - cx, Math.ceil(((x1 + 1) / sw - x0 / sw + pad * 2) * W));
      const ch = Math.min(H - cy, Math.ceil(((y1 + 1) / sh - y0 / sh + pad * 2) * H));
      const out = document.createElement('canvas');
      out.width = cw; out.height = ch;
      out.getContext('2d')!.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
      this.trimmed.set(src, out.toDataURL('image/png'));
    } catch { /* cross-origin or unsupported: keep the original */ }
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
  next(): void { this.activeIndex = (this.activeIndex + 1) % this.images.length; this.afterNav(); }
  prev(): void { this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length; this.afterNav(); }
  selectImage(i: number): void { this.activeIndex = i; this.afterNav(); }
  toggleStack(): void { this.stackExpanded = !this.stackExpanded; this.revealActiveThumb(); }

  /** Navigating returns to photos and recentres the image (zoom level is kept). */
  private afterNav(): void { this.videoPlaying = false; this.resetPan(); this.revealActiveThumb(); }

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

  // ---------- Zoom + pan (60 / 100 / 150 / 200 %) ----------
  zoomLevels = [60, 100, 150, 200];
  zoom = 100;
  panX = 0;
  panY = 0;
  dragging = false;
  private drag?: { x: number; y: number; px: number; py: number };

  get zoomTransform(): string { return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom / 100})`; }

  setZoom(z: number): void { this.zoom = z; this.clampPan(); }
  toggleZoom(): void { this.setZoom(this.zoom >= 150 ? 100 : 200); }          // double-click
  resetPan(): void { this.panX = 0; this.panY = 0; }

  /** Ctrl / ⌘ + wheel steps through the zoom levels; plain wheel still scrolls the page. */
  onStageWheel(e: WheelEvent): void {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const i = this.zoomLevels.indexOf(this.zoom);
    this.setZoom(this.zoomLevels[Math.min(this.zoomLevels.length - 1, Math.max(0, i + (e.deltaY < 0 ? 1 : -1)))]);
  }

  /** Keep the picture from being dragged out of the space. */
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

  /** When not zoomed in, a horizontal swipe / drag changes the image. */
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

  // ---------- Review video (plays in the main space, custom controls, loader) ----------
  videoPlaying = false;
  vLoading = false;
  vError = false;
  vPaused = false;
  vMuted = false;
  vProgress = 0;
  vCur = '0:00';
  vDur = '0:00';

  openVideo(event: Event): void {
    event.stopPropagation();
    this.vPaused = false; this.vMuted = false; this.vProgress = 0; this.vCur = '0:00'; this.vDur = '0:00';
    this.vLoading = true;   // shown until the browser has enough data to play
    this.vError = false;
    this.videoPlaying = true;
  }
  closeVideo(): void { this.videoPlaying = false; this.vLoading = false; this.vError = false; }

  /** Enough data to play: hide the loader and sync the play/pause icon (autoplay may be blocked). */
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
    v.play().catch(() => { /* autoplay blocked: user can press play */ });
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

  // ---------- Interest modal ----------
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

  /** When set, the modal enquires about this similar car instead of the main one. */
  inquiry: { name: string; price: string } | null = null;
  get modalName(): string { return this.inquiry?.name ?? this.carName; }
  get modalPrice(): string { return this.inquiry?.price ?? this.carPrice; }

  timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  minDate = new Date().toLocaleDateString('en-CA');
  form = this.emptyForm();

  private emptyForm() {
    return { name: '', phone: '', schedule: false, date: '', time: '10:00', tradeIn: false, tradeMake: '', tradeYear: '', tradeMileage: '' };
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
      const extra = [f.tradeYear.trim(), f.tradeMileage.trim() ? f.tradeMileage.trim() + ' km' : ''].filter(Boolean).join(', ');
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
    setTimeout(() => this.modalRoot?.nativeElement.querySelector<HTMLInputElement>('input')?.focus(), 450);
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
    const data = { title: this.modalName, text: `${this.modalName} · ${this.modalPrice} — A Plus Motors`, url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      this.shareLabel = 'Link copied';
      setTimeout(() => (this.shareLabel = 'Share car link'), 2000);
    } catch { /* dismissed or blocked */ }
  }

  goModal(route: string): void { this.closeModal(); this.leaveAndGo([route]); }

  // ---------- Similar-card actions (toggle state) ----------
  liked = new Set<number>();
  saved = new Set<number>();
  copiedId: number | null = null;

  private toggle(set: Set<number>, id: number): void { set.has(id) ? set.delete(id) : set.add(id); }

  likeCar(car: SimilarCar, e: Event): void { e.stopPropagation(); this.toggle(this.liked, car.id); }
  bookmarkCar(car: SimilarCar, e: Event): void { e.stopPropagation(); this.toggle(this.saved, car.id); }

  async shareCarItem(car: SimilarCar, e: Event): Promise<void> {
    e.stopPropagation();
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: car.name, text: `Check out this ${car.brand} ${car.name} at A Plus Motors`, url });
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

  // ---------- Escape / scroll ----------
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalOpen) this.closeModal();
    else if (this.videoPlaying) this.closeVideo();
  }

  private lockScroll(lock: boolean): void {
    document.body.style.overflow = lock ? 'hidden' : '';
    ScrollSmoother.get()?.paused(lock);
  }

  // ---------- Scroll reveal for the similar-cars section ----------
  private io?: IntersectionObserver;

  private observeReveals(): void {
    const els = this.host.nativeElement.querySelectorAll('.reveal');
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

  // ---------- Lazy loading for the similar-car images ----------
  // Native loading="lazy" can stay stuck inside transformed / scroll-smoothed wrappers,
  // so an observer sets src itself, well before the card reaches the screen.
  private imgIo?: IntersectionObserver;
  private imgSafetyTimer?: ReturnType<typeof setTimeout>;

  private loadLazyImg(img: HTMLImageElement): void {
    const src = img.dataset['src'];
    if (!src || img.getAttribute('src')) return;
    img.src = src;
  }

  private observeCardImages(): void {
    const imgs = Array.from(this.host.nativeElement.querySelectorAll<HTMLImageElement>('img[data-src]'));
    if (!('IntersectionObserver' in window)) { imgs.forEach(i => this.loadLazyImg(i)); return; }

    this.imgIo = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        this.loadLazyImg(en.target as HTMLImageElement);
        this.imgIo?.unobserve(en.target);
      });
    }, { rootMargin: '600px 0px' });
    imgs.forEach(i => this.imgIo!.observe(i));

    // Safety net: whatever is still unloaded after a moment gets loaded anyway.
    this.imgSafetyTimer = setTimeout(() => imgs.forEach(i => this.loadLazyImg(i)), 3000);
  }

  onCardImgLoad(e: Event): void {
    (e.target as HTMLElement).closest('.car-image-wrapper')?.classList.add('loaded');
  }

  onCardImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    const wrap = img.closest('.car-image-wrapper');
    if (!img.getAttribute('src')) return;       // nothing was requested yet
    if (img.dataset['retried'] !== '1') {       // one retry, with a cache-buster
      img.dataset['retried'] = '1';
      const base = img.dataset['src'] ?? '';
      setTimeout(() => { img.src = base + (base.includes('?') ? '&' : '?') + 'r=' + Date.now(); }, 600);
      return;
    }
    wrap?.classList.add('failed');
  }

  // ---------- Car on the road: reveals the criteria items as it passes ----------
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

  // ---------- Lifecycle + transitions ----------
  ngAfterViewInit(): void {
    this.jumpToTop();
    document.body.appendChild(this.modalRoot.nativeElement);
    this.observeReveals();
    this.observeCardImages();
    gsap.fromTo(this.panels, { scale: 1.15, transformOrigin: 'center center' },
      { scale: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform' });
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
      gsap.to(this.panels, { opacity: 1, scale: 1, duration: 0.65, ease: 'power2.inOut', clearProps: 'opacity,transform' });
    }
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.imgIo?.disconnect();
    if (this.imgSafetyTimer) clearTimeout(this.imgSafetyTimer);
    this.roadTween?.kill();
    gsap.killTweensOf(this.panels);
    this.modalRoot?.nativeElement.remove();
    this.lockScroll(false);
  }

  // ---------- Navigation ----------
  async goBack() { await this.playLeave(); this.location.back(); }
  goTo(route: string): void { this.leaveAndGo([route]); }
  goToMainStore(): void { this.goTo('/store'); }
  goToContact(): void { this.goTo('/contact'); }
  goToSpecs(): void { this.goTo('/specs'); }
}

export const specsLeaveGuard: CanDeactivateFn<Specs> = component =>
  component.playLeave().then(() => true);