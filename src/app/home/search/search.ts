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
import { Typewriter, prefersReducedMotion } from '../../typewriting';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TopCar {
  name: string;
  year: number;
  price: string;
  was?: string;
  flag?: string;
  image: string;
  mileage: string;
  gearbox: string;
  fuel: string;
  engine: string;
}

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
  readonly ideas = [
    'Family SUV under Ksh 3M',
    'Fuel efficient for the city',
    'Safe first car',
    'Tough for upcountry roads',
  ];

  readonly examples = [
    'A family car that seats 7 comfortably',
    'Fuel efficient car for city driving',
    'SUV that handles rough roads',
    'Automatic with low mileage under Ksh 3M',
    'Safe, reliable car for a first-time driver',
    'Spacious boot for luggage and road trips',
  ];

  readonly topCars: TopCar[] = [
    {
      name: 'Audi A4',
      year: 2013,
      price: 'Ksh 2,450,000',
      image: '1.png',
      mileage: '96,000 km',
      gearbox: 'Automatic',
      fuel: 'Petrol',
      engine: '2.0L',
    },
    {
      name: 'BMW 320i',
      year: 2018,
      price: 'Ksh 3,850,000',
      was: 'Ksh 4,100,000',
      flag: 'Deal',
      image: '1.png',
      mileage: '58,000 km',
      gearbox: 'Automatic',
      fuel: 'Petrol',
      engine: '2.0L',
    },
    {
      name: 'Toyota Harrier',
      year: 2020,
      price: 'Ksh 5,200,000',
      flag: 'New arrival',
      image: '1.png',
      mileage: '34,000 km',
      gearbox: 'Automatic',
      fuel: 'Petrol',
      engine: '2.0L',
    },
  ];

  private readonly openDelayMs = 500;

  private recognition: any;
  private typer?: Typewriter;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private viewReady = false;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initVoiceRecognition();
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
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
    }
  }
}