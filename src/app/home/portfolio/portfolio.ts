import { Component } from '@angular/core';
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
  /** Likes and shares already recorded for this car (from your backend later). */
  likes: number;
  shares: number;
}

interface Brand {
  id: number;
  name: string;
  logo: string;
}

@Component({
  selector: 'app-portfolio',
  imports: [CommonModule, Specs],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio {
  openedSpecs = false;

  /** Car ids the visitor has liked / bookmarked. Copies of the same car share state. */
  private likedIds = new Set<number>();
  private bookmarkedIds = new Set<number>();

  /** Shares made by this visitor, added on top of the car's stored share count. */
  private sharedExtra = new Map<number, number>();

  /** Car id whose "Link copied" note is showing (clipboard fallback for share). */
  copiedId: number | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private router: Router) {
    const shuffledCars = [...this.cars].sort(() => Math.random() - 0.5);
    this.displayCars = [
      ...shuffledCars,
      ...shuffledCars
    ];

    this.displayBrands = [
      ...this.brands,
    ];
  }

  openSpecs() {
    this.openedSpecs = !this.openedSpecs;
    this.router.navigate(['/specs']);
  }

  isLiked(id: number): boolean {
    return this.likedIds.has(id);
  }

  isBookmarked(id: number): boolean {
    return this.bookmarkedIds.has(id);
  }

  /** Stored likes, plus this visitor's like. */
  likeCount(car: Car): number {
    return car.likes + (this.likedIds.has(car.id) ? 1 : 0);
  }

  /** Stored shares, plus shares made by this visitor. */
  shareCount(car: Car): number {
    return car.shares + (this.sharedExtra.get(car.id) ?? 0);
  }

  /** 950 -> "950", 1240 -> "1.2K", 15300 -> "15K", 2400000 -> "2.4M" */
  formatCount(n: number): string {
    if (n >= 1_000_000) return this.trim(n / 1_000_000) + 'M';
    if (n >= 1_000) return this.trim(n / 1_000) + 'K';
    return String(n);
  }

  private trim(value: number): string {
    return (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10).toString();
  }

  toggleLike(id: number, event: Event) {
    event.stopPropagation();
    this.likedIds.has(id) ? this.likedIds.delete(id) : this.likedIds.add(id);
  }

  toggleBookmark(id: number, event: Event) {
    event.stopPropagation();
    this.bookmarkedIds.has(id) ? this.bookmarkedIds.delete(id) : this.bookmarkedIds.add(id);
  }

  async shareCar(car: Car, event: Event) {
    event.stopPropagation();

    const title = `${car.year} ${car.make.replace(/\s+/g, '')} ${car.model.trim()}`;
    const text = `${title}: ${car.price}`;
    const url = window.location.href;

    // Native share sheet where available (phones, some desktops).
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        this.countShare(car.id);
      } catch {
        // dismissed by the visitor: not counted
      }
      return;
    }

    // Fallback: copy the link and show a short "Link copied" note.
    try {
      await navigator.clipboard.writeText(url);
      this.countShare(car.id);
      this.copiedId = car.id;
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => (this.copiedId = null), 1600);
    } catch {
      // clipboard blocked: stay silent, not counted
    }
  }

  private countShare(id: number) {
    this.sharedExtra.set(id, (this.sharedExtra.get(id) ?? 0) + 1);
  }

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
    { id: 1, name: 'Toyota', logo: 'toyota-logo-2020.png' },
    { id: 2, name: 'Subaru', logo: 'subaru-logo-2019.png' },
    { id: 3, name: 'BMW', logo: 'bmw-logo-2020-1.png' },
    { id: 4, name: 'Mercedes', logo: 'mercedes-benz-logo-2011.png' },
    { id: 5, name: 'Audi', logo: 'audi-logo-2016.png' }
  ];

  displayCars: Car[] = [];
  displayBrands: Brand[] = [];

}