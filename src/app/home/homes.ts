import { Component, inject, AfterViewInit, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { Portfolio } from './portfolio/portfolio';
import { Footer } from './footer/footer';
import { Nav } from './nav/nav';
import { Cookies } from './cookies/cookies';
import { ChatBox } from './chat-box/chat-box';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-homes',
  imports: [CommonModule, RouterOutlet, Portfolio, Footer, Nav, Cookies, ChatBox],
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
  private docClickHandler = () => this.closeDropdown();

  brands: string[] = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru',
    'Mitsubishi', 'Isuzu', 'Suzuki', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Hyundai',
    'Kia', 'Peugeot', 'Renault', 'Land Rover', 'Lexus'
  ];

  models: string[] = [
    'Corolla', 'Camry', 'Civic', 'Accord', 'Note',
    'Demio', 'Impreza', 'Forester', 'Pajero', 'Hilux',
    'Fielder', 'Harrier', 'X-Trail', 'CX-5', 'Outback',
    'RAV4', 'CR-V', 'Navara', 'Ranger', 'Vitz'
  ];

  years: string[] = Array.from({ length: 30 }, (_, i) => `${2025 - i}`);

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
  }

  ngAfterViewInit(): void {
    // Always start at the top
    window.scrollTo(0, 0);

    this.zone.runOutsideAngular(() => {
      this.gsapCtx = gsap.context(() => {
        this.setupHeroPin();
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
    this.gsapCtx?.revert();
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
    this.activeDropdown = this.activeDropdown === type ? null : type;
  }

  selectOption(type: 'brand' | 'model' | 'year', value: string, event: Event): void {
    event.stopPropagation();
    if (type === 'brand') this.selectedBrand = value;
    if (type === 'model') this.selectedModel = value;
    if (type === 'year') this.selectedYear = value;
    this.activeDropdown = null;
  }

  closeDropdown(): void { this.activeDropdown = null; }

  get filteredModels(): string[] {
    if (!this.selectedBrand) return this.models;
    return this.models;
  }

  findCar(event: Event): void {
    event.stopPropagation();

    const search = {
      brand: this.selectedBrand,
      model: this.selectedModel,
      year: this.selectedYear,
    };
    console.log('Searching:', search);
    // REMEMBER TO ADD SEARCH SERVICE HERE TO GO TO SPECS

    this.resetSearch();
  }

  resetSearch(): void {
    this.selectedBrand = '';
    this.selectedModel = '';
    this.selectedYear = '';
    this.activeDropdown = null;
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