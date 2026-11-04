import { Component, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Specs } from './specs/specs';
import { Router } from '@angular/router';

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
}

interface Brand {
  id: number;
  name: string;
  logo: string;
}

@Component({
  selector: 'app-portfolio',
  standalone: true, // Assuming standalone since imports array is used
  imports: [CommonModule, Specs],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio implements AfterViewInit {
  openedSpecs = false;

  /** Reference to DOM elements for the scroll-reveal animation. */
  @ViewChildren('reveal') revealElements!: QueryList<ElementRef>;

  /** Track user interactions locally (to be synced with backend later). */
  private likedIds = new Set<number>();
  private bookmarkedIds = new Set<number>();
  private sharedExtra = new Map<number, number>();

  /** State for the "Link copied" clipboard fallback. */
  copiedId: number | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  displayCars: Car[] = [];
  displayBrands: Brand[] = [];

  constructor(private router: Router) {
    // Shuffle cars and duplicate the array so the marquee loops seamlessly.
    const shuffledCars = [...this.cars].sort(() => Math.random() - 0.5);
    this.displayCars = [...shuffledCars, ...shuffledCars];
    this.displayBrands = [...this.brands];
  }

  /** Initialize Intersection Observer to trigger CSS reveal animations on scroll. */
  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Stop observing once revealed
        }
      });
    }, { threshold: 0.15 }); // Trigger when 15% of the element is visible

    // Observe the text paragraphs
    const textNodes = document.querySelectorAll('.into-txt .reveal');
    textNodes.forEach(node => observer.observe(node));
  }

  /** Navigation handlers */
  openSpecs() {
    this.openedSpecs = !this.openedSpecs;
    this.router.navigate(['/specs']);
  }

  goToStore() {
    this.router.navigate(['/store']);
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

    // Native share sheet (Mobile iOS/Android, some desktops)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        this.countShare(car.id);
      } catch {
        // User dismissed the share sheet: do not count
      }
      return;
    }

    // Fallback: copy link to clipboard and show "Link copied" note
    try {
      await navigator.clipboard.writeText(url);
      this.countShare(car.id);
      this.copiedId = car.id;
      
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => (this.copiedId = null), 1600);
    } catch {
      // Clipboard access blocked by browser: fail silently
    }
  }

  private countShare(id: number) {
    this.sharedExtra.set(id, (this.sharedExtra.get(id) ?? 0) + 1);
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
      shares: 86
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
      shares: 54
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
      shares: 140
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
      shares: 21
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