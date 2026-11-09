import { Component, inject, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { Portfolio } from './portfolio/portfolio';
import { Footer } from './footer/footer';
import { Nav } from './nav/nav';
import { Cookies } from './cookies/cookies';
import { ChatBox } from './chat-box/chat-box';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

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

  private smoother?: ScrollSmoother;
  private gsapCtx?: gsap.Context;
  private router = inject(Router);
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
    // Opacity only: ScrollSmoother owns the transform on #smooth-content,
    // so tweening y/scale here would fight it and break the pin.
    gsap.from('#smooth-content', {
      opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.1, clearProps: 'opacity'
    });
  }

  ngAfterViewInit(): void {
    this.smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.6,
      effects: true
    });

    this.gsapCtx = gsap.context(() => {
      this.setupHeroPin();
      this.setupNavBlend();
      this.setupReveals();
    });

    // Re-measure once fonts/images have settled so the pin end point is exact.
    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

    document.addEventListener('click', this.docClickHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.docClickHandler);
    this.gsapCtx?.revert();
    this.smoother?.kill();
  }

  /**
   * Hero stays pinned at the top of the viewport while .cover-layer
   * (pride text, portfolio, footer) scrolls up over it.
   * pinSpacing:false => no extra blank scroll space; the cover layer
   * simply slides on top of the pinned hero.
   */
  private setupHeroPin(): void {
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      endTrigger: '.cover-layer',
      end: 'top top',
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true
    });

    // Subtle depth: hero recedes slightly as it gets covered.
    // No scale here: scaling a pinned layer re-rasterises text each frame
    // and causes sub-pixel shimmer. Opacity + y stay on the GPU.
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
        scrub: true
      }
    });
  }

  /**
   * Header colour follows the scroll: it starts transparent (so it is exactly
   * the hero colour) and blends to the solid body colour by the time the body
   * (.cover-layer) reaches the bottom edge of the header. Scrubbed, so it moves
   * at the same pace as the content sliding up.
   */
  private setupNavBlend(): void {
    const nav = document.querySelector('.nav-container') as HTMLElement | null;
    if (!nav) return;

    gsap.fromTo(nav,
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
          invalidateOnRefresh: true
        }
      }
    );
  }

  /** Adds .is-visible to .reveal elements as they scroll into view. */
  private setupReveals(): void {
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => els.forEach(el => el.classList.add('is-visible'))
    });
  }

  hideCookies(): void { this.cookiesClicked = true; }
  openSearch(): void { this.searchWindowOpened = true; }
  closeSearch(event: Event): void { event.stopPropagation(); this.searchWindowOpened = false; }
  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }
  toggleChat(): void { this.isChatOpen = !this.isChatOpen; }

  goHome(): void {
    if (this.smoother) {
      this.smoother.scrollTo(0, true);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  // ==========================================
  // UPDATED NAVIGATION TO MATCH ROUTING
  // ==========================================

  goToImport(event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/imported-trade-in'], {
      queryParams: { tab: 'import' }
    });
  }

  goToTradeIn(event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/imported-trade-in'], {
      queryParams: { tab: 'trade-in' }
    });
  }
}