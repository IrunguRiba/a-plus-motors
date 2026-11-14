import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Typewriter, prefersReducedMotion } from '../../typewriting';
import { ApiServices } from '../../services/api-services';
import { ApiCar } from '../../interfaces/car-interface';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SearchCar {
  id: string;
  name: string;
  year: number;
  price: string;
  priceValue: number;
  was?: string;
  flag?: string;
  image: string;
  mileage: string;
  mileageKm: number;
  gearbox: string;
  fuel: string;
  engine: string;
  body: string;
  /** Lower-case text of every searchable field of the car. */
  haystack: string;
}

interface SearchOutcome {
  cars: SearchCar[];
  /** false when nothing matched exactly and these are the closest options. */
  exact: boolean;
}

/** Words that carry no meaning for matching. */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'with', 'and', 'or', 'in', 'on', 'at', 'that', 'to', 'of', 'my', 'me', 'i',
  'want', 'need', 'looking', 'find', 'show', 'car', 'cars', 'good', 'best', 'handles', 'road', 'roads',
  'fuel', 'driving', 'comfortably', 'seats', 'seat', 'seater', 'spacious', 'boot', 'luggage', 'trips',
  'safe', 'reliable', 'first', 'time', 'driver', 'low', 'mileage', 'ksh', 'kes', 'kshs', 'km', 'under',
  'below', 'less', 'than', 'up', 'max', 'maximum', 'within', 'is', 'are', 'it', 'any', 'some',
]);

/** Everyday words mapped to what they mean in the stock data (any of them counts as a match). */
const MEANING: Record<string, string[]> = {
  family: ['suv', 'van', 'mpv', '7 seats', 'seven'],
  economical: ['economical', 'hybrid', 'hatchback'],
  efficient: ['economical', 'hybrid', 'hatchback'],
  economy: ['economical', 'hybrid', 'hatchback'],
  city: ['hatchback', 'economical'],
  rough: ['4wd', 'awd', 'pickup'],
  tough: ['4wd', 'awd', 'pickup'],
  upcountry: ['4wd', 'awd', 'pickup'],
  offroad: ['4wd', 'awd', 'pickup'],
  truck: ['pickup'],
  saloon: ['sedan'],
  '4x4': ['4wd', 'awd'],
  hatch: ['hatchback'],
};

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Output() searchStateChange = new EventEmitter<boolean>();

  @Input() active = false;

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  isOpen = false;
  searchQuery = '';
  isListening = false;

  readonly defaultPlaceholder = 'Search Anything. . .';

  /** Suggestion chips. Replaced with ones built from the stock once it loads. */
  ideas: string[] = [
    'Family SUV under Ksh 3M',
    'Fuel efficient for the city',
    'Safe first car',
    'Tough for upcountry roads',
  ];

  /**
   * Phrases the placeholder types out. Shown until the stock loads, then replaced
   * (in place, because the Typewriter holds this same array) with phrases built from the database.
   */
  readonly examples: string[] = [
    'A family car that seats 7 comfortably',
    'Fuel efficient car for city driving',
    'SUV that handles rough roads',
    'Automatic with low mileage under Ksh 3M',
    'Safe, reliable car for a first-time driver',
    'Spacious boot for luggage and road trips',
  ];

  /** Cars shown when nothing has been typed (recommended first, then newest). */
  topCars: SearchCar[] = [];

  /** Current search results (only used when hasQuery is true). */
  results: SearchCar[] = [];
  hasQuery = false;
  resultNote = '';

  private cars: SearchCar[] = [];
  private carsSub?: Subscription;

  private readonly openDelayMs = 500;
  private static readonly MAX_RESULTS = 3;

  private recognition: any;
  private typer?: Typewriter;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private viewReady = false;

  constructor(
    private ngZone: NgZone,
    private api: ApiServices,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initVoiceRecognition();
    this.loadCars();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (prefersReducedMotion()) return;

    this.ngZone.runOutsideAngular(() => {
      this.typer = new Typewriter({
        phrases: this.examples,
        render: text => this.setPlaceholder(text),
        canRun: () => !this.searchQuery.trim() && !this.isListening,
      });
    });

    if (this.active) this.scheduleTyping();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['active'] || !this.viewReady) return;
    if (this.active) {
      this.scheduleTyping();
    } else {
      this.cancelTyping();
    }
  }

  ngOnDestroy(): void {
    this.cancelTyping();
    this.carsSub?.unsubscribe();
  }

  /* ============================================================
     DATABASE
     ============================================================ */

  private loadCars(): void {
    this.carsSub?.unsubscribe();
    this.carsSub = this.api.getAllCars().subscribe({
      next: (all) => {
        this.cars = all.filter((c) => c.showOnWeb).map((c) => this.toSearchCar(c));
        this.topCars = this.pickTopCars(all);

        const { phrases, ideas } = this.buildSuggestions();
        if (phrases.length) this.examples.splice(0, this.examples.length, ...phrases);
        if (ideas.length) this.ideas = ideas;

        this.restartTyping();
        this.updateResults(); // re-run if the user already typed something
      },
      error: () => {
        /* keep the built-in examples if the stock can't be loaded */
      },
    });
  }

  private toSearchCar(c: ApiCar): SearchCar {
    const x = c as any; // optional fields the interface may not declare
    const priceValue = Number(c.price) || 0;
    const mileageKm = Number(c.mileage) || 0;
    const created = new Date(c.createdAt).getTime();
    const isNew = Number.isFinite(created) && Date.now() - created < 30 * 24 * 60 * 60 * 1000;
    const features = Array.isArray(x.features) ? x.features.join(' ') : '';
    const body = String(c.body ?? '');

    return {
      id: c._id,
      name: `${c.make} ${c.model}`.trim(),
      year: c.year,
      price: `Ksh ${priceValue.toLocaleString('en-US')}`,
      priceValue,
      flag: isNew ? 'New arrival' : undefined,
      image: c.photos?.[0] ?? '',
      mileage: `${mileageKm.toLocaleString('en-US')} km`,
      mileageKm,
      gearbox: c.transmission ?? '',
      fuel: c.fuel ?? '',
      engine: `${((Number(c.engine) || 0) / 1000).toFixed(1)}L`,
      body,
      haystack: [c.make, c.model, c.year, body, x.colour, c.fuel, c.transmission, x.drive, c.notes, features]
        .filter((v) => v !== undefined && v !== null)
        .join(' ')
        .toLowerCase(),
    };
  }

  /** Recommended cars first, then the newest ones. */
  private pickTopCars(all: ApiCar[]): SearchCar[] {
    const web = all.filter((c) => c.showOnWeb);
    const time = (c: ApiCar) => new Date(c.createdAt).getTime() || 0;
    const sorted = [...web].sort((a, b) => {
      if (!!a.recommended !== !!b.recommended) return a.recommended ? -1 : 1;
      return time(b) - time(a);
    });
    return sorted.slice(0, 3).map((c) => this.toSearchCar(c));
  }

  /* ============================================================
     TYPEWRITER TEXT + CHIPS FROM THE DATABASE
     Every phrase is built from real cars, and every phrase works
     when searched (see runSearch).
     ============================================================ */

  private buildSuggestions(): { phrases: string[]; ideas: string[] } {
    const cars = this.cars;
    if (!cars.length) return { phrases: [], ideas: [] };

    const models: string[] = [];
    const filters: string[] = [];
    const addTo = (list: string[], s: string) => {
      const t = s.replace(/\s+/g, ' ').trim();
      if (t && !list.includes(t)) list.push(t);
    };

    const shuffled = this.shuffle([...cars]);

    // Real models in stock, e.g. "Toyota Prado TX-L 2020"
    shuffled.slice(0, 3).forEach((c) => addTo(models, `${c.name} ${c.year}`));

    // Body type + a budget that really has cars, e.g. "SUV under Ksh 4.5M"
    const byBody = new Map<string, SearchCar[]>();
    cars.forEach((c) => {
      if (c.body) byBody.set(c.body, [...(byBody.get(c.body) ?? []), c]);
    });
    [...byBody.entries()].slice(0, 3).forEach(([body, list]) => {
      const prices = list.map((c) => c.priceValue).filter((p) => p > 0).sort((a, b) => a - b);
      if (!prices.length) return;
      const median = prices[Math.floor(prices.length / 2)];
      addTo(filters, `${body} under Ksh ${this.fmtMoney(this.niceCeil(median))}`);
    });

    // Gearbox + fuel + body of real cars, e.g. "Automatic diesel SUV"
    shuffled.slice(3, 6).forEach((c) =>
      addTo(filters, `${c.gearbox} ${c.fuel.toLowerCase()} ${c.body}`)
    );

    // Low mileage, based on the lowest mileages in stock
    const kms = cars.map((c) => c.mileageKm).filter((k) => k > 0).sort((a, b) => a - b);
    if (kms.length) {
      const limit = Math.ceil(kms[Math.min(2, kms.length - 1)] / 10000) * 10000;
      addTo(filters, `Low mileage under ${limit.toLocaleString('en-US')} km`);
    }

    return {
      phrases: this.shuffle([...models, ...filters]).slice(0, 8),
      ideas: filters.slice(0, 4),
    };
  }

  private niceCeil(v: number): number {
    const step = v >= 1_000_000 ? 500_000 : v >= 100_000 ? 100_000 : 10_000;
    return Math.ceil(v / step) * step;
  }

  private fmtMoney(v: number): string {
    return v >= 1_000_000 ? `${+(v / 1_000_000).toFixed(1)}M` : v.toLocaleString('en-US');
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private restartTyping(): void {
    if (!this.typer) return;
    this.typer.reset();
    this.setPlaceholder(this.defaultPlaceholder);
    if (this.active) this.scheduleTyping();
  }

  /* ============================================================
     SEARCH
     Understands: make, model, year, body, fuel, gearbox, drive,
     colour, notes and features; budgets such as "under Ksh 3M";
     mileage such as "under 50,000 km"; and everyday words such as
     "family", "city" or "rough roads". If nothing matches exactly,
     the closest cars are shown instead of an empty list.
     ============================================================ */

  onQueryChange(value: string): void {
    this.searchQuery = value;
    this.updateResults();
  }

  private updateResults(): void {
    const q = this.searchQuery.trim();
    const outcome = q.length >= 2 ? this.runSearch(q) : null;

    if (!outcome || !outcome.cars.length) {
      this.hasQuery = false;
      this.results = [];
      this.resultNote = '';
      return;
    }

    this.hasQuery = true;
    this.results = outcome.cars.slice(0, Search.MAX_RESULTS);
    const n = outcome.cars.length;
    this.resultNote = outcome.exact
      ? n > Search.MAX_RESULTS
        ? `Top ${Search.MAX_RESULTS} of ${n} matches for “${q}”`
        : `${n} ${n === 1 ? 'match' : 'matches'} for “${q}”`
      : `No exact match for “${q}”. Closest options:`;
  }

  private runSearch(raw: string): SearchOutcome | null {
    if (!this.cars.length) return null;

    let text = raw.toLowerCase();
    let maxPrice = Infinity;
    let maxKm = Infinity;

    // "under Ksh 3M", "below 2,500,000", "under 50,000 km"
    const limitRe =
      /(?:under|below|less than|up to|max(?:imum)?|within)\s*(?:ksh\.?|kes|kshs)?\s*(\d[\d,]*(?:\.\d+)?)\s*(million|m|k|km)?\b/g;
    text = text.replace(limitRe, (_m, num: string, unit?: string) => {
      const n = parseFloat(num.replace(/,/g, ''));
      if (unit === 'km') maxKm = n;
      else if (unit === 'm' || unit === 'million') maxPrice = n * 1_000_000;
      else if (unit === 'k') maxPrice = n * 1_000;
      else maxPrice = n < 1000 ? n * 1_000_000 : n; // "under 3" means 3 million
      return ' ';
    });

    const tokens = text
      .replace(/[^a-z0-9\-.\s]/g, ' ')
      .split(/\s+/)
      .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, ''))
      .filter((t) => t && !STOP_WORDS.has(t));

    const hasLimit = maxPrice !== Infinity || maxKm !== Infinity;
    if (!tokens.length && !hasLimit) return null;

    const tokenHits = (car: SearchCar) => tokens.filter((t) => this.tokenMatches(car.haystack, t)).length;
    const withinLimits = (c: SearchCar) => c.priceValue <= maxPrice && c.mileageKm <= maxKm;

    // 1. Everything matches
    const pool = this.cars.filter(withinLimits);
    const exact = pool.filter((c) => tokenHits(c) === tokens.length);
    if (exact.length) {
      return { cars: this.byPrice(exact), exact: true };
    }

    // 2. Next best: cars matching some of the words, best first
    const partial = pool
      .map((c) => ({ c, s: tokenHits(c) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.c.priceValue - b.c.priceValue)
      .map((x) => x.c);
    if (partial.length) return { cars: partial, exact: false };

    // 3. Still nothing: closest on words, then closest to the budget
    const ranked = this.cars
      .map((c) => ({ c, s: tokenHits(c) }))
      .sort((a, b) => b.s - a.s || a.c.priceValue - b.c.priceValue)
      .map((x) => x.c);
    return { cars: ranked, exact: false };
  }

  private byPrice(cars: SearchCar[]): SearchCar[] {
    return [...cars].sort((a, b) => a.priceValue - b.priceValue);
  }

  private tokenMatches(haystack: string, token: string): boolean {
    const options = MEANING[token] ?? [token];
    return options.some((o) =>
      /^\d{1,2}$/.test(o) ? new RegExp(`\\b${o}\\b`).test(haystack) : haystack.includes(o)
    );
  }

  trackById = (_: number, car: SearchCar) => car.id;

  /** The cars on screen: results while searching, otherwise the top picks. */
  get shownCars(): SearchCar[] {
    return this.hasQuery ? this.results : this.topCars;
  }

  get listLabel(): string {
    return this.hasQuery ? this.resultNote : 'Popular right now';
  }

  openSpecs(car: SearchCar): void {
    if (!car?.id) return;
    this.closeSearch();
    this.router.navigate(['/specs'], { queryParams: { id: car.id } });
  }

  private scheduleTyping(): void {
    if (!this.typer) return;
    if (this.startTimer) clearTimeout(this.startTimer);
    this.ngZone.runOutsideAngular(() => {
      this.startTimer = setTimeout(() => {
        this.focusInput();
        this.typer?.start();
      }, this.openDelayMs);
    });
  }

  private focusInput(): void {
    if (!window.matchMedia('(hover: hover)').matches) return;
    this.searchInput?.nativeElement.focus({ preventScroll: true });
  }

  private cancelTyping(): void {
    if (this.startTimer) clearTimeout(this.startTimer);
    this.startTimer = null;
    this.typer?.reset();
    this.setPlaceholder(this.defaultPlaceholder);
  }

  private setPlaceholder(text: string): void {
    const el = this.searchInput?.nativeElement;
    if (el) el.placeholder = text;
  }

  openSearch(): void {
    this.isOpen = true;
    this.searchStateChange.emit(this.isOpen);
  }

  closeSearch(): void {
    if (this.isListening) {
      this.stopVoiceSearch();
    }
    this.isOpen = false;
    this.searchStateChange.emit(this.isOpen);
  }

  /* ============================================================
     VOICE
     ============================================================ */

  private initVoiceRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.ngZone.run(() => {
          this.searchQuery = transcript;
          this.isListening = false;
          this.onSearch();
        });
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.ngZone.run(() => {
          this.isListening = false;
        });
      };

      this.recognition.onend = () => {
        this.ngZone.run(() => {
          this.isListening = false;
        });
      };
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }
  }

  toggleVoiceSearch(): void {
    if (!this.recognition) {
      alert('Voice search is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stopVoiceSearch();
    } else {
      this.startVoiceSearch();
    }
  }

  private startVoiceSearch(): void {
    this.recognition.start();
    this.isListening = true;
    this.setPlaceholder('Listening…');
  }

  private stopVoiceSearch(): void {
    this.recognition.stop();
    this.isListening = false;
  }

  searchFor(term: string): void {
    this.searchQuery = term;
    this.onSearch();
  }

  onSearch(): void {
    this.updateResults();
  }
}