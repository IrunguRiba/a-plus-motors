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

interface DragSample {
  x: number;
  t: number;
}

interface SavedState {
  bookmarks: string[];
  recent: string[];
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio implements AfterViewInit, OnDestroy {
  readonly recommendedTarget = 6;
  readonly storeMax = 21;
  private static readonly STORE_COLS = 3;

  /* ---------- local storage ---------- */
  private static readonly STORAGE_KEY = 'aplus:portfolio:v1';
  /** Max number of recently bookmarked / clicked cars remembered. */
  private static readonly RECENT_MAX = 100;

  /** How long (ms) the "Link copied" label stays visible. */
  private static readonly COPIED_MS = 2000;

  /* ---------- belt tuning ---------- */
  /** Pixels the pointer must move before a press becomes a drag (otherwise it's a click). */
  private static readonly DRAG_THRESHOLD = 6;
  /** Glide length: distance travelled after release ≈ release speed (px/ms) × GLIDE_MS. Higher = longer glide. */
  private static readonly GLIDE_MS = 325;
  /** Cap on release speed (px/ms) so a violent flick can't launch across the whole belt. */
  private static readonly MAX_VELOCITY = 3;
  /** Only samples from the last N ms are used to measure release speed. */
  private static readonly VELOCITY_WINDOW_MS = 100;
  /** If true, the glide lands exactly on the nearest card's left edge. If false, it glides freely. */
  private static readonly SNAP_TO_CARD = false;
  /** How far (px) the intro hint nudges the belt to show it can be dragged. */
  private static readonly HINT_NUDGE_PX = 140;
  /** How long (ms) the "Drag" hint pill stays visible. */
  private static readonly HINT_VISIBLE_MS = 4200;

  loading = true;
  error = '';

  @ViewChildren('reveal') revealElements!: QueryList<ElementRef>;
  @ViewChild('beltViewport') beltViewport?: ElementRef<HTMLDivElement>;

  /** Bookmarked car ids (persisted). */
  private bookmarkedIds = new Set<string>();
  /** Car ids the user bookmarked or clicked, most recent first (persisted). */
  private recentIds: string[] = [];
  private sharedExtra = new Map<string, number>();

  /** Id of the car whose link was just copied (drives the "Link copied" label). */
  copiedId: string | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  private carsSub?: Subscription;

  /** Cars shown in the belt (already ordered). */
  recommendedCars: Car[] = [];
  /** Unordered belt pool and store pool, re-ordered whenever the user interacts. */
  private recommendedBase: Car[] = [];
  private storePool: Car[] = [];

  private storeBaseCars: Car[] = [];
  filteredStoreCars: Car[] = [];

  displayBrands: Brand[] = [];
  activeFilter: CarFilter = 'all';

  /* ---------- belt arrows + hint state ---------- */
  canScrollLeft = false;
  canScrollRight = false;
  hintVisible = false;
  private beltInView = false;
  private hintPlayed = false;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;

  /* ---------- belt drag state ---------- */
  private dragPointerDown = false;
  private dragActive = false;
  private suppressClick = false;
  private dragPressX = 0;
  private dragStartX = 0;
  private dragStartScroll = 0;
  private dragTargetX = 0;
  private dragRaf: number | null = null;
  private samples: DragSample[] = [];
  private settleRaf: number | null = null;
  private teardownFns: Array<() => void> = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private api: ApiServices,
    private zone: NgZone
  ) {
    this.displayBrands = [...this.brands];
    this.loadState();
    this.fetchCars();
  }

  /* ============================================================
     LOCAL STORAGE — bookmarks + recent interactions
     ============================================================ */

  private loadState(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(Portfolio.STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<SavedState>;
      const bookmarks = Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [];
      const recent = Array.isArray(parsed.recent) ? parsed.recent : [];

      this.bookmarkedIds = new Set(bookmarks.filter((x) => typeof x === 'string'));
      this.recentIds = recent.filter((x) => typeof x === 'string');
    } catch {
      /* corrupted or blocked storage — start fresh */
    }
  }

  private saveState(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const state: SavedState = {
        bookmarks: [...this.bookmarkedIds],
        recent: this.recentIds,
      };
      localStorage.setItem(Portfolio.STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — ignore */
    }
  }

  /** Moves a car id to the front of the "recent" list and saves it. */
  private recordInteraction(id: string): void {
    this.recentIds = [id, ...this.recentIds.filter((x) => x !== id)].slice(
      0,
      Portfolio.RECENT_MAX
    );
    this.saveState();
  }

  /**
   * Stable sort: most recently bookmarked/clicked first, then other
   * bookmarked cars, then everything else in its original order.
   */
  private prioritize(cars: Car[]): Car[] {
    const rankOf = new Map<string, number>();
    this.recentIds.forEach((id, i) => rankOf.set(id, i));

    const rank = (c: Car): number => {
      const r = rankOf.get(c.id);
      if (r !== undefined) return r;
      return this.bookmarkedIds.has(c.id) ? 1_000 : 100_000;
    };

    return [...cars].sort((a, b) => rank(a) - rank(b));
  }

  /** Rebuilds the belt and store lists using the current priority order. */
  private applyOrder(): void {
    this.recommendedCars = this.prioritize(this.recommendedBase);
    this.storeBaseCars = this.prioritize(this.storePool).slice(0, this.storeMax);
    this.setFilter(this.activeFilter);
  }

  /* ============================================================
     DATA
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

        this.recommendedBase = this.dedupeById(
          recommendedPool.map((c) => this.toCar(c))
        );

        const recommendedIds = new Set(recommendedPool.map((c) => c._id));
        const storeCars = this.dedupeById(
          web
            .filter((c) => !recommendedIds.has(c._id))
            .map((c) => this.toCar(c))
        );

        // Shuffle the whole pool once; the 21-car cut happens after priority ordering
        // so a bookmarked / clicked car can never be cut from the grid.
        this.storePool = this.shuffle([...storeCars]);

        this.applyOrder();

        this.loading = false;
        this.cdr.markForCheck();

        // Cards render on the next tick: refresh arrows and maybe play the intro hint.
        setTimeout(() => {
          this.updateArrows();
          this.tryPlayHint();
        }, 0);
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
     STORE GRID
     ============================================================ */

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

    this.initBeltDrag();
    this.initBeltNav();
  }

  ngOnDestroy() {
    this.carsSub?.unsubscribe();
    this.stopSettle();
    if (this.dragRaf !== null) cancelAnimationFrame(this.dragRaf);
    this.teardownFns.forEach((fn) => fn());
    this.teardownFns = [];
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    if (this.hintTimer) clearTimeout(this.hintTimer);
  }

  /* ============================================================
     BELT — mouse/pen drag + smooth settle.
     • Drag position is applied once per animation frame (no jitter
       from uneven mouse event rates).
     • Release speed is measured over the last ~100ms of movement.
     • The settle is a single time-based ease-out whose starting
       speed matches the release speed, so there is no jolt when
       you let go. It is frame-rate independent.
     • Touch uses native horizontal scrolling.
     • A press that moves < DRAG_THRESHOLD px is a normal click and
       navigates to /specs?id=<car.id>.
     ============================================================ */

  private initBeltDrag() {
    const el = this.beltViewport?.nativeElement;
    if (!el) return;

    // Run outside Angular so pointer events don't trigger change detection.
    this.zone.runOutsideAngular(() => {
      const maxScroll = () => Math.max(0, el.scrollWidth - el.clientWidth);
      const clamp = (v: number) => Math.min(Math.max(v, 0), maxScroll());

      const renderDrag = () => {
        this.dragRaf = null;
        if (!this.dragActive) return;
        el.scrollLeft = clamp(this.dragStartScroll - (this.dragTargetX - this.dragStartX));
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return; // native scroll handles touch
        if (e.button !== 0) return;

        this.stopSettle();
        this.dragPointerDown = true;
        this.dragActive = false;
        this.dragPressX = e.clientX;
        this.samples = [{ x: e.clientX, t: performance.now() }];
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!this.dragPointerDown) return;

        if (!this.dragActive) {
          if (Math.abs(e.clientX - this.dragPressX) < Portfolio.DRAG_THRESHOLD) return;
          // Start the drag from the current pointer position so there is no 6px "jump".
          this.dragActive = true;
          this.dragStartX = e.clientX;
          this.dragStartScroll = el.scrollLeft;
          el.classList.add('is-dragging');
        }

        e.preventDefault();
        this.dragTargetX = e.clientX;

        const now = performance.now();
        this.samples.push({ x: e.clientX, t: now });
        const cutoff = now - Portfolio.VELOCITY_WINDOW_MS;
        while (this.samples.length > 2 && this.samples[0].t < cutoff) this.samples.shift();

        if (this.dragRaf === null) this.dragRaf = requestAnimationFrame(renderDrag);
      };

      const endDrag = () => {
        if (!this.dragPointerDown) return;
        this.dragPointerDown = false;

        if (!this.dragActive) return; // it was a click — let it through

        this.dragActive = false;
        el.classList.remove('is-dragging');

        if (this.dragRaf !== null) {
          cancelAnimationFrame(this.dragRaf);
          this.dragRaf = null;
        }
        // Apply the final pointer position before settling.
        el.scrollLeft = clamp(this.dragStartScroll - (this.dragTargetX - this.dragStartX));

        // Swallow the click the browser fires right after a drag.
        this.suppressClick = true;
        setTimeout(() => (this.suppressClick = false), 0);

        this.settle(el, this.releaseVelocity());
      };

      // Capture phase on the viewport: blocks the card's (click) after a drag.
      const onClickCapture = (e: MouseEvent) => {
        if (this.suppressClick) {
          e.stopPropagation();
          e.preventDefault();
        }
      };

      const onDragStart = (e: Event) => e.preventDefault(); // no ghost image
      const onSelectStart = (e: Event) => {
        if (this.dragActive) e.preventDefault();
      };
      const onInterrupt = () => this.stopSettle();

      el.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
      el.addEventListener('click', onClickCapture, true);
      el.addEventListener('dragstart', onDragStart);
      document.addEventListener('selectstart', onSelectStart);
      el.addEventListener('wheel', onInterrupt, { passive: true });
      el.addEventListener('touchstart', onInterrupt, { passive: true });

      this.teardownFns.push(() => {
        el.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
        el.removeEventListener('click', onClickCapture, true);
        el.removeEventListener('dragstart', onDragStart);
        document.removeEventListener('selectstart', onSelectStart);
        el.removeEventListener('wheel', onInterrupt);
        el.removeEventListener('touchstart', onInterrupt);
      });
    });
  }

  /** Release speed in scrollLeft px/ms, measured over the last ~100ms of the drag. */
  private releaseVelocity(): number {
    const s = this.samples;
    if (s.length < 2) return 0;

    const first = s[0];
    const last = s[s.length - 1];

    // Pointer rested before release → no fling.
    if (performance.now() - last.t > 60) return 0;

    const dt = last.t - first.t;
    if (dt <= 0) return 0;

    const v = (first.x - last.x) / dt; // dragging left => scrollLeft increases
    return Math.max(-Portfolio.MAX_VELOCITY, Math.min(Portfolio.MAX_VELOCITY, v));
  }

  /**
   * Smooth settle: ease-out cubic from the current position to a landing point.
   * Duration is chosen so the curve's starting speed equals the release speed
   * (ease-out cubic starts at 3·D/T), so the hand-off from drag to glide is seamless.
   */
  private settle(el: HTMLElement, velocity: number) {
    this.stopSettle();

    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const from = el.scrollLeft;

    let to = Math.min(Math.max(from + velocity * Portfolio.GLIDE_MS, 0), max);
    if (Portfolio.SNAP_TO_CARD) to = this.nearestSnap(el, to, max);

    const dist = to - from;
    if (Math.abs(dist) < 1) return;

    const speed = Math.max(Math.abs(velocity), 0.5);
    const duration = Math.min(Math.max((3 * Math.abs(dist)) / speed, 260), 1100);
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.scrollLeft = from + dist * eased;

      if (t < 1) {
        this.settleRaf = requestAnimationFrame(step);
      } else {
        el.scrollLeft = to;
        this.settleRaf = null;
      }
    };

    this.settleRaf = requestAnimationFrame(step);
  }

  /** Left edge of the card closest to `target` (used only when SNAP_TO_CARD is on). */
  private nearestSnap(el: HTMLElement, target: number, max: number): number {
    const viewLeft = el.getBoundingClientRect().left;
    const cards = el.querySelectorAll<HTMLElement>('.car-card');
    let best = target;
    let bestDist = Infinity;

    cards.forEach((card) => {
      const left = card.getBoundingClientRect().left - viewLeft + el.scrollLeft;
      const d = Math.abs(left - target);
      if (d < bestDist) {
        bestDist = d;
        best = left;
      }
    });

    return Math.min(Math.max(best, 0), max);
  }

  private stopSettle() {
    if (this.settleRaf !== null) {
      cancelAnimationFrame(this.settleRaf);
      this.settleRaf = null;
    }
  }

  /* ============================================================
     BELT — arrows + intro drag hint.
     • Left arrow hidden at the first car, right arrow hidden at
       the last car (based on scroll position).
     • Arrows glide to the previous / next card.
     • When the belt first scrolls into view, it nudges sideways
       and a "Drag" pill shows, then it returns to the start.
       Any interaction cancels the hint.
     ============================================================ */

  private initBeltNav() {
    const el = this.beltViewport?.nativeElement;
    if (!el) return;

    this.zone.runOutsideAngular(() => {
      let scrollRaf: number | null = null;
      const onScroll = () => {
        if (scrollRaf !== null) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = null;
          this.updateArrows();
        });
      };

      const onUserInteract = () => this.hideHint();

      el.addEventListener('scroll', onScroll, { passive: true });
      el.addEventListener('pointerdown', onUserInteract);
      el.addEventListener('wheel', onUserInteract, { passive: true });
      el.addEventListener('touchstart', onUserInteract, { passive: true });

      // Cards render after the data arrives and on resize: keep arrows accurate.
      const ro = new ResizeObserver(() => this.updateArrows());
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);

      // Play the intro hint once, when the belt is actually on screen.
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.beltInView = entry.isIntersecting;
            if (entry.isIntersecting) this.tryPlayHint();
          });
        },
        { threshold: 0.5 }
      );
      io.observe(el);

      this.teardownFns.push(() => {
        el.removeEventListener('scroll', onScroll);
        el.removeEventListener('pointerdown', onUserInteract);
        el.removeEventListener('wheel', onUserInteract);
        el.removeEventListener('touchstart', onUserInteract);
        if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
        ro.disconnect();
        io.disconnect();
      });
    });

    this.updateArrows();
  }

  /** Show/hide the arrows depending on whether there is more belt on each side. */
  private updateArrows() {
    const el = this.beltViewport?.nativeElement;
    if (!el) return;

    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft < max - 2;

    if (left !== this.canScrollLeft || right !== this.canScrollRight) {
      this.zone.run(() => {
        this.canScrollLeft = left;
        this.canScrollRight = right;
        this.cdr.markForCheck();
      });
    }
  }

  /** Arrow click: glide to the previous (-1) or next (1) car. */
  scrollBelt(dir: 1 | -1) {
    const el = this.beltViewport?.nativeElement;
    if (!el) return;

    this.hideHint();

    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const viewLeft = el.getBoundingClientRect().left;
    const cur = el.scrollLeft;
    const lefts = Array.from(el.querySelectorAll<HTMLElement>('.car-card')).map(
      (card) => card.getBoundingClientRect().left - viewLeft + cur
    );

    let target = cur;
    if (dir > 0) {
      const next = lefts.find((l) => l > cur + 2);
      target = next ?? max;
    } else {
      const prev = [...lefts].reverse().find((l) => l < cur - 2);
      target = prev ?? 0;
    }
    target = Math.min(Math.max(target, 0), max);

    const duration = Math.min(Math.max(450 + Math.abs(target - cur) * 0.35, 450), 900);
    this.zone.runOutsideAngular(() => this.animateScroll(el, target, duration));
  }

  /** Time-based ease-in-out scroll to `to`. Shares settleRaf so any interaction cancels it. */
  private animateScroll(el: HTMLElement, to: number, duration: number, onDone?: () => void) {
    this.stopSettle();

    const from = el.scrollLeft;
    const dist = to - from;
    if (Math.abs(dist) < 1) {
      onDone?.();
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      el.scrollLeft = from + dist * eased;

      if (t < 1) {
        this.settleRaf = requestAnimationFrame(step);
      } else {
        el.scrollLeft = to;
        this.settleRaf = null;
        onDone?.();
      }
    };

    this.settleRaf = requestAnimationFrame(step);
  }

  /** Plays the intro hint once, when the belt is in view and cars are rendered. */
  private tryPlayHint() {
    if (this.hintPlayed || !this.beltInView || this.recommendedCars.length === 0) return;
    if (!this.beltViewport?.nativeElement) return;

    this.hintPlayed = true;
    setTimeout(() => this.playHint(), 500);
  }

  private playHint() {
    const el = this.beltViewport?.nativeElement;
    if (!el) return;

    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    if (max < 40 || el.scrollLeft > 4) return; // nothing to drag, or user already moved it

    this.zone.run(() => {
      this.hintVisible = true;
      this.cdr.markForCheck();
    });
    this.hintTimer = setTimeout(() => this.hideHint(), Portfolio.HINT_VISIBLE_MS);

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const nudge = Math.min(Portfolio.HINT_NUDGE_PX, max);
    this.zone.runOutsideAngular(() => {
      this.animateScroll(el, nudge, 750, () => this.animateScroll(el, 0, 750));
    });
  }

  private hideHint() {
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
    if (!this.hintVisible) return;
    this.zone.run(() => {
      this.hintVisible = false;
      this.cdr.markForCheck();
    });
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */

  openSpecs(car: Car) {
    if (this.suppressClick) return; // safety net: ignore click that ended a drag
    if (!car?.id) {
      console.warn('[openSpecs] missing car.id');
      return;
    }

    // Remember the click so this car is first in its list next time.
    this.recordInteraction(car.id);

    this.router.navigate(['/specs'], { queryParams: { id: car.id } });
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
     INTERACTIONS — bookmark + share
     ============================================================ */

  isBookmarked(id: string): boolean { return this.bookmarkedIds.has(id); }
  shareCount(car: Car): number { return car.shares + (this.sharedExtra.get(car.id) ?? 0); }

  formatCount(n: number): string {
    if (n >= 1_000_000) return this.trim(n / 1_000_000) + 'M';
    if (n >= 1_000) return this.trim(n / 1_000) + 'K';
    return String(n);
  }

  private trim(value: number): string {
    return (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10).toString();
  }

  /**
   * Toggles a bookmark (saved to localStorage). Bookmarking moves the car to
   * the front of its list. `fromBelt` also glides the belt back to the start
   * so the car stays in view.
   */
  toggleBookmark(id: string, event: Event, fromBelt = false) {
    event.stopPropagation();

    const nowBookmarked = !this.bookmarkedIds.has(id);
    if (nowBookmarked) {
      this.bookmarkedIds.add(id);
      this.recordInteraction(id); // saves + moves to front
      this.applyOrder();

      if (fromBelt) {
        setTimeout(() => {
          const el = this.beltViewport?.nativeElement;
          if (!el) return;
          this.zone.runOutsideAngular(() => this.animateScroll(el, 0, 450));
        }, 0);
      }
    } else {
      this.bookmarkedIds.delete(id);
      this.saveState();
    }
  }

  /** Direct link to a car's specs page, e.g. http://localhost:4200/specs?id=6ae416... */
  private carUrl(car: Car): string {
    const tree = this.router.createUrlTree(['/specs'], { queryParams: { id: car.id } });
    return window.location.origin + this.router.serializeUrl(tree);
  }

  /** Phones/tablets (touch as the main pointer) get the native share sheet; desktops copy the link. */
  private canNativeShare(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      !!window.matchMedia?.('(pointer: coarse)').matches
    );
  }

  /** Copies text to the clipboard, falling back to a hidden textarea when the Clipboard API is blocked. */
  private async copyText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to legacy copy */
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  /** Shows the "Link copied" label on one car for a moment. */
  private showCopied(id: string) {
    this.copiedId = id;
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => {
      this.copiedId = null;
      this.cdr.markForCheck();
    }, Portfolio.COPIED_MS);
    this.cdr.markForCheck();
  }

  async shareCar(car: Car, event: Event) {
    event.stopPropagation();

    const title = `${car.year} ${car.make.replace(/\s+/g, '')} ${car.model.trim()}`;
    const text = `${title}: ${car.price}`;
    const url = this.carUrl(car);

    // Mobile: open the native share sheet.
    if (this.canNativeShare()) {
      try {
        await navigator.share({ title, text, url });
        this.countShare(car.id);
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return; // user closed the sheet
        // any other failure → fall back to copying the link
      }
    }

    // Desktop (or share sheet failed): copy the car link and say so.
    if (await this.copyText(url)) {
      this.countShare(car.id);
      this.showCopied(car.id);
    }
  }

  private countShare(id: string) {
    this.sharedExtra.set(id, (this.sharedExtra.get(id) ?? 0) + 1);
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