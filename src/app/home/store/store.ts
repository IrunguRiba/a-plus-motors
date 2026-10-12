import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { Nav2 } from '../nav-2/nav-2';

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
  private lastScrollY = 0;

  constructor(private router: Router) {}

  cars = [
    { image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' },
    { image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' },
    { image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' },
    { image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' },
    { image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' },
    { image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' },
    { image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' },
    { image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' },
    { image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=600&auto=format&fit=crop', year: '2013', brand: 'Audi A4', price: 'Ksh 8, 695000' }
  ];

  // ── Filter dropdown state ──
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

  setActiveView(view: 'all' | 'favorites', event?: Event): void {
    event?.stopPropagation();
    this.activeView = view;
    if (view === 'all') {
      this.selectedBrandFilter = '';
      this.selectedYearFilter = '';
      this.activeFilterDropdown = null;
    }
  }

  toggleFilterDropdown(type: 'brand' | 'year', event: Event): void {
    event.stopPropagation();
    this.activeFilterDropdown = this.activeFilterDropdown === type ? null : type;
  }

  selectFilterOption(type: 'brand' | 'year', value: string, event: Event): void {
    event.stopPropagation();
    if (type === 'brand') this.selectedBrandFilter = value;
    if (type === 'year')  this.selectedYearFilter = value;
    this.activeFilterDropdown = null;
    console.log('Filter applied:', {
      brand: this.selectedBrandFilter,
      year: this.selectedYearFilter
    });
  }

  closeFilterDropdown(): void {
    this.activeFilterDropdown = null;
  }

  ngAfterViewInit(): void {
    // Car cards entrance animation
    this.ctx = gsap.context(() => {
      gsap.from('.car-card', {
        opacity: 0,
        x: -60,
        scale: 0.85,
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.04
      });
    }, this.smoothContent.nativeElement);

    // Floating Nav2 on the left with GSAP
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
      // Entrance: slide in from left + fade
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

  goToSpecs(): void {
    this.router.navigate(['/specs']);
  }

  goHome(): void {
    this.router.navigate(['']);
  }
}