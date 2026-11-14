import { Component, inject, AfterViewInit, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Portfolio } from './portfolio/portfolio';
import { Footer } from './footer/footer';
import { Nav } from './nav/nav';
import { Cookies } from './cookies/cookies';
import { ChatBox } from './chat-box/chat-box';
import { SafeVideoUrlPipe } from './portfolio/specs/safe-url.pipe';
import { ApiServices } from '../services/api-services';
import {
  ReviewVideo,
  resolveReviewVideo,
  primeMutedVideo,
  markReady,
  prefersReducedMotion,
} from '../home/portfolio/specs/review-video';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface HeroSlide {
  id: number;
  video: ReviewVideo;
}

/** The bits of each web car the hero search needs. */
interface StockEntry {
  id: string;
  make: string;
  model: string;
  year: string;
  created: number;
}

@Component({
  selector: 'app-homes',
  imports: [CommonModule, RouterOutlet, Portfolio, Footer, Nav, Cookies, ChatBox, SafeVideoUrlPipe],
  templateUrl: './homes.html',
  styleUrl: './homes.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  cookiesClicked = false;
  searchWindowOpened = false;
  isChatOpen = false;
  isMenuOpen = false;
  logoImg = 'fav3.png';

  private gsapCtx?: gsap.Context;
  private router = inject(Router);
  private zone = inject(NgZone);
  private api = inject(ApiServices);
  private docClickHandler = () => this.closeDropdown();

  private static readonly HERO_EMBED_MS = 25000;

  /** All review videos found on the web cars. */
  heroPool: ReviewVideo[] = [];
  /** 0 or 1 items: the review video currently playing behind the hero. */
  heroSlides: HeroSlide[] = [];
  /** False once the hero is fully covered by the page, so the video stops playing off-screen. */
  heroActive = true;

  private heroQueue: ReviewVideo[] = [];
  private heroSeq = 0;
  private heroTimer: ReturnType<typeof setTimeout> | null = null;
  private heroSub?: Subscription;

  /** Brands in stock (replaced with the real ones once the cars load). */
  brands: string[] = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru',
    'Mitsubishi', 'Isuzu', 'Suzuki', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Hyundai',
    'Kia', 'Peugeot', 'Renault', 'Land Rover', 'Lexus'
  ];

  /** Shown only until the cars load, or if they can't be loaded. */
  private readonly fallbackModels: string[] = [
    'Corolla', 'Camry', 'Civic', 'Accord', 'Note',
    'Demio', 'Impreza', 'Forester', 'Pajero', 'Hilux',
    'Fielder', 'Harrier', 'X-Trail', 'CX-5', 'Outback',
    'RAV4', 'CR-V', 'Navara', 'Ranger', 'Vitz'
  ];
  private readonly fallbackYears: string[] = Array.from({ length: 30 }, (_, i) => `${2025 - i}`);

  /** Every car on the website, as the search sees it. */
  private stock: StockEntry[] = [];

  /** Message under the search bar (nothing picked, no cars, ...). */
  searchHint = '';

  selectedBrand = '';
  selectedModel = '';
  selectedYear = '';
  activeDropdown: 'brand' | 'model' | 'year' | null = null;

  ngOnInit(): void {
    // Stop the browser from restoring scroll on back/forward
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    this.zone.runOutsideAngular(() => {
      gsap.from('#home-content', {
        opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.1, clearProps: 'opacity'
      });
    });

    this.loadCars();
  }

  ngAfterViewInit(): void {
    // Always start at the top
    window.scrollTo(0, 0);

    this.zone.runOutsideAngular(() => {
      this.gsapCtx = gsap.context(() => {
        this.setupHeroPin();
        this.setupHeroColor();
        this.setupHeroVideoVisibility();
        this.setupNavBlend();
        this.setupReveals();
      });

      if ((document as any).fonts?.ready) {
        (document as any).fonts.ready.then(() => ScrollTrigger.refresh());
      }
      window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    });

    // Stays inside the zone so closing a dropdown still updates the view
    document.addEventListener('click', this.docClickHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.docClickHandler);
    this.heroSub?.unsubscribe();
    if (this.heroTimer) clearTimeout(this.heroTimer);
    this.gsapCtx?.revert();
  }

  // ============== HERO VIDEO ==============

  /** Collects every review video from the API and starts a random one. */
  private loadCars(): void {
    this.heroSub = this.api.getWebCars().subscribe({
      next: (cars) => {
        // The search dropdowns are built from the same cars.
        this.setSearchCars(cars);

        if (prefersReducedMotion()) return; // keep the calm dark hero, no motion

        const seen = new Set<string>();
        const pool: ReviewVideo[] = [];
        for (const c of cars) {
          const v = resolveReviewVideo(c.reviewVideoUrl);
          if (!v || seen.has(v.src)) continue;
          seen.add(v.src);
          pool.push(v);
        }
        this.heroPool = pool;
        this.heroQueue = [];
        this.nextHeroVideo();
      },
      error: () => { /* no video: the hero stays on its dark background */ },
    });
  }

  /** Picks the next random review (every video plays once before any repeats). */
  nextHeroVideo(): void {
    if (this.heroTimer) {
      clearTimeout(this.heroTimer);
      this.heroTimer = null;
    }

    if (!this.heroPool.length) {
      this.heroSlides = [];
      return;
    }

    if (!this.heroQueue.length) {
      this.heroQueue = this.shuffle([...this.heroPool]);
      const current = this.heroSlides[0]?.video.src;
      if (this.heroQueue.length > 1 && this.heroQueue[0].src === current) {
        this.heroQueue.push(this.heroQueue.shift()!);
      }
    }

    const video = this.heroQueue.shift()!;
    this.heroSlides = [{ id: ++this.heroSeq, video }];

    // Embeds loop forever and give no "ended" event, so rotate them on a timer.
    if (video.kind === 'embed' && this.heroPool.length > 1) {
      this.heroTimer = setTimeout(() => this.nextHeroVideo(), Home.HERO_EMBED_MS);
    }
  }

  onHeroLoaded(el: HTMLVideoElement): void {
    primeMutedVideo(el);
  }

  onHeroPlaying(el: HTMLElement): void {
    markReady(el);
  }

  onHeroEnded(): void {
    this.nextHeroVideo();
  }

  /** A video that can't be played is dropped from the pool; the next one starts. */
  onHeroError(slide: HeroSlide): void {
    this.heroPool = this.heroPool.filter((v) => v.src !== slide.video.src);
    this.heroQueue = this.heroQueue.filter((v) => v.src !== slide.video.src);
    this.nextHeroVideo();
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ============== GSAP setups ==============
  private setupHeroPin(): void {
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      endTrigger: '.cover-layer',
      end: 'top top',
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });

    gsap.to('#hero .item-2', {
      opacity: 0.55,
      y: -30,
      ease: 'none',
      force3D: true,
      overwrite: 'auto',
      scrollTrigger: {
        trigger: '.cover-layer',
        start: 'top bottom',
        end: 'top top',
        scrub: true,
      },
    });
  }

  /**
   * Slowly turns the hero into the portfolio colour while the page scrolls up.
   * --hero-mix goes 0 → 1: the dark shade fades out, the portfolio-coloured
   * layer fades in over the video, and the hero text/rings go from light to dark.
   * The look itself is in homes.css (everything reads --hero-mix).
   */
  private setupHeroColor(): void {
    gsap.fromTo(
      '#hero',
      { '--hero-mix': 0 },
      {
        '--hero-mix': 1,
        ease: 'none',
        immediateRender: true,
        scrollTrigger: {
          trigger: '.cover-layer',
          start: 'top bottom',
          end: 'top 30%',
          scrub: 0.8, // a little lag so the change feels slow and soft
          invalidateOnRefresh: true,
        },
      }
    );
  }

  /** Stops the hero video once the cover layer has fully covered it. */
  private setupHeroVideoVisibility(): void {
    ScrollTrigger.create({
      trigger: '.cover-layer',
      start: 'top top',
      onEnter: () => this.setHeroActive(false),
      onLeaveBack: () => this.setHeroActive(true),
    });
  }

  private setHeroActive(active: boolean): void {
    this.zone.run(() => {
      this.heroActive = active;
    });
  }

  private setupNavBlend(): void {
    const nav = document.querySelector('.nav-container') as HTMLElement | null;
    if (!nav) return;

    gsap.fromTo(
      nav,
      { '--nav-mix': 0 },
      {
        '--nav-mix': 1,
        ease: 'none',
        immediateRender: true,
        scrollTrigger: {
          trigger: '.cover-layer',
          start: 'top bottom',
          end: () => `top ${nav.offsetHeight}px`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  }

  private setupReveals(): void {
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => els.forEach((el) => el.classList.add('is-visible')),
    });
  }

  // ============== UI helpers ==============
  hideCookies(): void { this.cookiesClicked = true; }
  openSearch(): void { this.searchWindowOpened = true; }
  closeSearch(event: Event): void { event.stopPropagation(); this.searchWindowOpened = false; }
  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }
  toggleChat(): void { this.isChatOpen = !this.isChatOpen; }

  goHome(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleDropdown(type: 'brand' | 'model' | 'year', event: Event): void {
    event.stopPropagation();
    this.searchHint = '';
    this.activeDropdown = this.activeDropdown === type ? null : type;
  }

  selectOption(type: 'brand' | 'model' | 'year', value: string, event: Event): void {
    event.stopPropagation();
    this.searchHint = '';

    if (type === 'brand') {
      this.selectedBrand = value;
      // Drop a model / year that this brand doesn't have.
      if (this.selectedModel && !this.filteredModels.includes(this.selectedModel)) this.selectedModel = '';
      if (this.selectedYear && !this.years.includes(this.selectedYear)) this.selectedYear = '';
    }

    if (type === 'model') {
      this.selectedModel = value;
      // Picking a model first fills in its brand.
      if (!this.selectedBrand) {
        const hit = this.stock.find((c) => c.model === value);
        if (hit) this.selectedBrand = hit.make;
      }
      if (this.selectedYear && !this.years.includes(this.selectedYear)) this.selectedYear = '';
    }

    if (type === 'year') this.selectedYear = value;

    this.activeDropdown = null;
  }

  closeDropdown(): void { this.activeDropdown = null; }

  /** Models in stock for the chosen brand (all models when no brand is chosen). */
  get filteredModels(): string[] {
    if (!this.stock.length) return this.fallbackModels;
    const pool = this.selectedBrand
      ? this.stock.filter((c) => c.make === this.selectedBrand)
      : this.stock;
    return this.unique(pool.map((c) => c.model)).sort((a, b) => a.localeCompare(b));
  }

  /** Years in stock for the chosen brand / model, newest first. */
  get years(): string[] {
    if (!this.stock.length) return this.fallbackYears;
    const pool = this.stock.filter(
      (c) =>
        (!this.selectedBrand || c.make === this.selectedBrand) &&
        (!this.selectedModel || c.model === this.selectedModel)
    );
    return this.unique(pool.map((c) => c.year)).sort((a, b) => Number(b) - Number(a));
  }

  private unique(values: string[]): string[] {
    return [...new Set(values)];
  }

  private setSearchCars(
    cars: ReadonlyArray<{ _id: string; make: string; model: string; year: number; createdAt?: string }>
  ): void {
    const seen = new Set<string>();
    const stock: StockEntry[] = [];
    for (const c of cars ?? []) {
      if (!c?._id || seen.has(c._id) || !c.make || !c.model) continue;
      seen.add(c._id);
      stock.push({
        id: c._id,
        make: c.make,
        model: c.model,
        year: String(c.year),
        created: new Date(c.createdAt ?? 0).getTime() || 0,
      });
    }
    if (!stock.length) return;

    this.stock = stock;
    this.brands = this.unique(stock.map((c) => c.make)).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Finds the car for the chosen brand / model / year. Nothing is ever "not found":
   * if there is no exact match it falls back to the next best (same brand and model
   * in another year, then the same brand, and so on).
   * One car goes straight to its specs page; several go to the store, filtered.
   */
  findCar(event: Event): void {
    event.stopPropagation();

    const b = this.selectedBrand;
    const m = this.selectedModel;
    const y = this.selectedYear;

    if (!b && !m && !y) {
      this.searchHint = 'Pick a brand, model or year to find a car.';
      this.activeDropdown = 'brand';
      return;
    }

    if (!this.stock.length) {
      this.searchHint = 'No cars are available right now. Please check back soon.';
      return;
    }

    // Best match first, then looser and looser.
    const steps: Array<[string, string, string]> = [
      [b, m, y],
      [b, m, ''],
      [b, '', y],
      ['', m, y],
      [b, '', ''],
      ['', m, ''],
      ['', '', y],
    ];

    const tried = new Set<string>();
    for (const [sb, sm, sy] of steps) {
      const key = `${sb}|${sm}|${sy}`;
      if (key === '||' || tried.has(key)) continue;
      tried.add(key);

      const hits = this.stock
        .filter((c) => (!sb || c.make === sb) && (!sm || c.model === sm) && (!sy || c.year === sy))
        .sort((p, q) => q.created - p.created);
      if (!hits.length) continue;

      this.goToResults(hits, sb, sm, sy);
      this.resetSearch();
      return;
    }

    // Safety net: never leave the visitor with nothing.
    this.router.navigate(['/store']);
    this.resetSearch();
  }

  private goToResults(hits: StockEntry[], make: string, model: string, year: string): void {
    if (hits.length === 1) {
      this.router.navigate(['/specs'], { queryParams: { id: hits[0].id } });
      return;
    }

    const queryParams: Record<string, string> = {};
    if (make) queryParams['make'] = make;
    if (model) queryParams['model'] = model;
    if (year) queryParams['year'] = year;
    this.router.navigate(['/store'], { queryParams });
  }

  resetSearch(): void {
    this.selectedBrand = '';
    this.selectedModel = '';
    this.selectedYear = '';
    this.activeDropdown = null;
    this.searchHint = '';
  }

  goToImport(event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/imported-trade-in'], {
      queryParams: { tab: 'import' },
    });
  }

  goToTradeIn(event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/imported-trade-in'], {
      queryParams: { tab: 'trade-in' },
    });
  }
}