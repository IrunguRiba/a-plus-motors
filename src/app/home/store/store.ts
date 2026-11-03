import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { Nav2 } from '../nav-2/nav-2';

interface RawCar {
  year: string;
  make: string;
  name: string;
  price: number;
  was?: number;
  km: number;
  gearbox: string;
  fuel: string;
  engine: string;
  isNew?: boolean;
}

interface StoreCar {
  id: number;
  image: string;
  year: string;
  make: string;
  name: string;
  price: string;
  oldPrice: string;
  mileage: string;
  gearbox: string;
  fuel: string;
  engine: string;
  isNew: boolean;
  deal: boolean;
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, Nav2],
  templateUrl: './store.html',
  styleUrl: './store.css'
})
export class Store implements AfterViewInit, OnDestroy {
  @ViewChild('smoothContent', { static: true }) smoothContent!: ElementRef;
  @ViewChild(Nav2, { read: ElementRef }) nav2!: ElementRef<HTMLElement>;

  private ctx!: gsap.Context;
  private navCtx!: gsap.Context;
  private destroyed = false;

  private readonly LIKED_KEY = 'aplus.store.liked';
  private readonly SAVED_KEY = 'aplus.store.saved';

  constructor(private router: Router, private location: Location) {
    this.liked = this.load(this.LIKED_KEY);
    this.saved = this.load(this.SAVED_KEY);
    this.refresh(false);
  }

  private photos = [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop'
  ];

  private raw: RawCar[] = [
    { year: '2013', make: 'Audi', name: 'A4', price: 2450000, km: 96000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.0L' },
    { year: '2018', make: 'BMW', name: '320i', price: 3850000, was: 4100000, km: 58000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.0L' },
    { year: '2020', make: 'Toyota', name: 'Harrier', price: 5200000, km: 34000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.0L', isNew: true },
    { year: '2016', make: 'Mercedes-Benz', name: 'C200', price: 3300000, was: 3550000, km: 72000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.0L' },
    { year: '2019', make: 'Mazda', name: 'CX-5', price: 3450000, km: 45000, gearbox: 'Automatic', fuel: 'Diesel', engine: '2.2L' },
    { year: '2022', make: 'Subaru', name: 'Forester', price: 4750000, km: 18000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.0L', isNew: true },
    { year: '2015', make: 'Land Rover', name: 'Discovery Sport', price: 3900000, km: 88000, gearbox: 'Automatic', fuel: 'Diesel', engine: '2.2L' },
    { year: '2021', make: 'Volkswagen', name: 'Tiguan', price: 4300000, was: 4600000, km: 29000, gearbox: 'Automatic', fuel: 'Petrol', engine: '1.4L' },
    { year: '2017', make: 'Honda', name: 'Vezel', price: 2150000, km: 61000, gearbox: 'Automatic', fuel: 'Hybrid', engine: '1.5L' },
    { year: '2023', make: 'Lexus', name: 'NX 250', price: 8200000, km: 9000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.5L', isNew: true },
    { year: '2014', make: 'Nissan', name: 'X-Trail', price: 1750000, was: 1900000, km: 112000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.0L' },
    { year: '2024', make: 'Hyundai', name: 'Tucson', price: 4950000, km: 5000, gearbox: 'Automatic', fuel: 'Petrol', engine: '1.6L', isNew: true },
    { year: '2019', make: 'Audi', name: 'Q5', price: 5600000, km: 49000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.0L' },
    { year: '2020', make: 'BMW', name: 'X3', price: 6100000, was: 6450000, km: 41000, gearbox: 'Automatic', fuel: 'Diesel', engine: '2.0L' },
    { year: '2018', make: 'Toyota', name: 'Land Cruiser Prado', price: 7300000, km: 67000, gearbox: 'Automatic', fuel: 'Diesel', engine: '2.8L' },
    { year: '2016', make: 'Mazda', name: 'Demio', price: 1050000, km: 78000, gearbox: 'Automatic', fuel: 'Petrol', engine: '1.3L' },
    { year: '2021', make: 'Mercedes-Benz', name: 'GLC 300', price: 8900000, km: 26000, gearbox: 'Automatic', fuel: 'Petrol', engine: '2.0L', isNew: true },
    { year: '2012', make: 'Subaru', name: 'Impreza', price: 1250000, was: 1400000, km: 121000, gearbox: 'Manual', fuel: 'Petrol', engine: '1.6L' }
  ];

  private allCars: StoreCar[] = this.raw.map((r, i) => ({
    id: i + 1,
    image: this.photos[i % this.photos.length],
    year: r.year,
    make: r.make,
    name: r.name,
    price: this.money(r.price),
    oldPrice: r.was ? this.money(r.was) : '',
    mileage: `${r.km.toLocaleString('en-US')} km`,
    gearbox: r.gearbox,
    fuel: r.fuel,
    engine: r.engine,
    isNew: !!r.isNew,
    deal: !!r.was
  }));

  cars: StoreCar[] = [];

  readonly pageSize = 6;
  page = 1;
  totalPages = 1;

  liked = new Set<number>();
  saved = new Set<number>();
  copiedId: number | null = null;

  activeFilterDropdown: 'brand' | 'year' | null = null;
  selectedBrandFilter: string = '';
  selectedYearFilter: string = '';

  brands: string[] = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru',
    'Mitsubishi', 'Isuzu', 'Suzuki', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Hyundai',
    'Kia', 'Peugeot', 'Renault', 'Land Rover', 'Lexus'
  ];

  years: string[] = Array.from({ length: 30 }, (_, i) => `${2025 - i}`);

  activeView: 'all' | 'favorites' = 'all';

  trackById(_: number, car: StoreCar): number {
    return car.id;
  }

  private money(n: number): string {
    return `Ksh ${n.toLocaleString('en-US')}`;
  }

  private load(key: string): Set<number> {
    try {
      return new Set<number>(JSON.parse(localStorage.getItem(key) ?? '[]'));
    } catch {
      return new Set<number>();
    }
  }

  private persist(key: string, set: Set<number>): void {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch { }
  }

  private refresh(animate = true): void {
    const list = this.allCars.filter(c =>
      (this.activeView === 'all' || this.saved.has(c.id)) &&
      (!this.selectedBrandFilter || c.make === this.selectedBrandFilter) &&
      (!this.selectedYearFilter || c.year === this.selectedYearFilter)
    );
    this.totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    this.page = Math.min(Math.max(1, this.page), this.totalPages);
    const start = (this.page - 1) * this.pageSize;
    this.cars = list.slice(start, start + this.pageSize);
    if (animate) this.animateCards();
  }

  private animateCards(): void {
    setTimeout(() => {
      if (this.destroyed || !this.ctx) return;
      this.ctx.add(() => {
        gsap.fromTo('.car-card',
          { opacity: 0, x: -60, scale: 0.85 },
          { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: 'power2.out', stagger: 0.04, clearProps: 'opacity,transform' }
        );
      });
    }, 0);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setActiveView(view: 'all' | 'favorites', event?: Event): void {
    event?.stopPropagation();
    this.activeView = view;
    this.activeFilterDropdown = null;
    if (view === 'all') {
      this.selectedBrandFilter = '';
      this.selectedYearFilter = '';
    }
    this.page = 1;
    this.refresh();
  }

  toggleFilterDropdown(type: 'brand' | 'year', event: Event): void {
    event.stopPropagation();
    this.activeFilterDropdown = this.activeFilterDropdown === type ? null : type;
  }

  selectFilterOption(type: 'brand' | 'year', value: string, event: Event): void {
    event.stopPropagation();
    if (type === 'brand') this.selectedBrandFilter = value;
    if (type === 'year') this.selectedYearFilter = value;
    this.activeFilterDropdown = null;
    this.page = 1;
    this.refresh();
  }

  closeFilterDropdown(): void {
    this.activeFilterDropdown = null;
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.refresh();
    this.scrollToTop();
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page--;
    this.refresh();
    this.scrollToTop();
  }

  toggleLike(car: StoreCar, event: Event): void {
    event.stopPropagation();
    this.liked.has(car.id) ? this.liked.delete(car.id) : this.liked.add(car.id);
    this.persist(this.LIKED_KEY, this.liked);
  }

  toggleSave(car: StoreCar, event: Event): void {
    event.stopPropagation();
    this.saved.has(car.id) ? this.saved.delete(car.id) : this.saved.add(car.id);
    this.persist(this.SAVED_KEY, this.saved);
    if (this.activeView === 'favorites') this.refresh(false);
  }

  private carUrl(car: StoreCar): string {
    const tree = this.router.createUrlTree(['/specs'], { queryParams: { id: car.id } });
    return window.location.origin + this.location.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  async shareCar(car: StoreCar, event: Event): Promise<void> {
    event.stopPropagation();
    const url = this.carUrl(car);
    const title = `${car.year} ${car.make} ${car.name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} · ${car.price} — A Plus Motors`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.copiedId = car.id;
      setTimeout(() => {
        if (this.copiedId === car.id) this.copiedId = null;
      }, 2000);
    } catch { }
  }

  ngAfterViewInit(): void {
    this.ctx = gsap.context(() => {
      gsap.from('.car-card', {
        opacity: 0,
        x: -60,
        scale: 0.85,
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.04,
        clearProps: 'opacity,transform'
      });
    }, this.smoothContent.nativeElement);

    this.setupFloatingNav();

    document.addEventListener('click', this.onDocumentClick, true);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    document.addEventListener('wheel', this.onScroll, { passive: true });
    document.addEventListener('touchmove', this.onScroll, { passive: true });
  }

  private setupFloatingNav(): void {
    if (!this.nav2?.nativeElement) return;

    const navEl = this.nav2.nativeElement;
    const inner = navEl.querySelector('.floating-menu-wrapper') as HTMLElement | null;
    const target = inner ?? navEl;

    this.navCtx = gsap.context(() => {
      gsap.from(target, {
        opacity: 0,
        x: -80,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.2
      });
    }, navEl);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.ctx?.revert();
    this.navCtx?.revert();
    document.removeEventListener('click', this.onDocumentClick, true);
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('wheel', this.onScroll);
    document.removeEventListener('touchmove', this.onScroll);
  }

  private onDocumentClick = (event: MouseEvent): void => {
    if (this.activeFilterDropdown === null) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.closest('.filter-dropdown-portal')) return;
    if (target.closest('.filter-item.dropdown')) return;
    if (target.closest('.filter-item.center')) return;

    this.closeFilterDropdown();
  };

  private onScroll = (event: Event): void => {
    if (this.activeFilterDropdown === null) return;

    const target = event.target as HTMLElement | null;
    if (target && target.closest('.filter-dropdown-portal')) return;

    this.closeFilterDropdown();
  };

  goToSpecs(car?: StoreCar, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/specs'], car ? { queryParams: { id: car.id } } : {});
  }

  goHome(): void {
    this.router.navigate(['']);
  }

  goToImport(): void {
    this.router.navigate(['/imported-trade-in'], {
      queryParams: { tab: 'import' }
    });
  }

  goToTradeIn(): void {
    this.router.navigate(['/imported-trade-in'], {
      queryParams: { tab: 'trade-in' }
    });
  }

  gotoFinance(): void {
    this.router.navigate(['/financing']);
  }
}