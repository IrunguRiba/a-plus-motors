import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnDestroy, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Search } from '../search/search';
import { Typewriter, prefersReducedMotion } from '../../typewriting';

interface MenuTarget {
  path?: string;
  query?: Record<string, string>;
}

interface MenuLink extends MenuTarget {
  label: string;
}

interface MenuFeature extends MenuTarget {
  title: string;
  text: string;
  image: string;
  long: boolean;
}

interface MenuItem {
  key: string;
  label: string;
  title: string;
  links: MenuLink[];
  feature: MenuFeature;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [Search, CommonModule],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav implements AfterViewInit, OnDestroy {
  email = 'gmail.png';
  ig = 'ig.png';
  twitter = 'twitter.png';
  whatsapp = 'whatsapp.png';
  facebook = 'facebook.png';
  phone = 'call.png';
  youtube = 'youtube.png';

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 20;
  }
  scrolled = false;
  

  @Input() cookiesClicked = false;
  @Input() searchWindowOpened = false;
  @Input() isChatOpen = false;
  @Input() isMenuOpen = false;
  @Input() logoImg = 'fav3.png';

  @Output() openSearchEvent = new EventEmitter<void>();
  @Output() closeSearchEvent = new EventEmitter<Event>();
  @Output() goHomeEvent = new EventEmitter<void>();
  @Output() toggleMenuEvent = new EventEmitter<void>();
  @Output() toggleChatEvent = new EventEmitter<void>();

  private router = inject(Router);
  private zone = inject(NgZone);

  /** Closed-state search box: types example searches (what the car is for, features) on a loop. */
  @ViewChild('searchTag') searchTag?: ElementRef<HTMLElement>;

  /** Keep these short (about 24 characters): the box has a fixed width so the bar never shifts. */
  readonly searchHints = [
    '7-seater family, under 2.5M. . .',
    'fuel efficient  for town. . . ',
    'tough enough for upcountry roads. . .',
    'automatic, low mileage, Nairobi registered. . . ',
    'An SUV under Ksh 3M',
    'Best car for suprises',
    'First car for a fresh graduate',
    'safari-ready 4x4, diesel',
    'A matatu-free commute, cheap to run',
    'car for Mombasa heat, strong AC',
  ];

  private hintTyper?: Typewriter;

  car1 = '1.png';

  /** Feature text longer than this many words is cut with "..." and its title gets underlined. */
  readonly featureWordLimit = 40;

  activeSubmenu = 'home';

  menu: MenuItem[] = [
    {
      key: 'home',
      label: 'Home',
      title: 'Home',
      links: [
        { label: 'Featured Cars', path: '/store' },
        { label: 'New Arrivals', path: '/store' },
        { label: 'Latest Offers', path: '/store' },
        { label: 'Blogs', path: '/blogs' },
      ],
      feature: this.feature('Find Your Perfect Ride', 'Explore our wide range of vehicles, from fresh arrivals to carefully inspected pre-owned cars, all in one place.Explore our wide range of vehicles, from fresh arrivals to carefully inspected pre-owned cars, all in one place.'),
    },
    {
      key: 'about',
      label: 'About Us',
      title: 'About Us',
      links: [
        { label: 'Our Story', path: '/about-us' },
        { label: 'Our Team', path: '/about-us' },
        { label: 'Careers', path: '/about-us' },
        { label: 'News & Media', path: '/about-us' },
      ],
      feature: this.feature('Our Values', 'Quality, trust and performance guide everything we do, from the cars we select to the way we look after every customer long after the sale.'),
    },
  
 
    {
      key: 'financing',
      label: 'Financing',
      title: 'Financing',
      links: [
        { label: 'Loan Options', path: '/financing', query: { tab: 'options' } },
        { label: 'Calculate Payments', path: '/financing', query: { tab: 'calculator' } },
        { label: 'Apply Now', path: '/financing', query: { tab: 'apply' } },
        { label: 'Insurance Partners', path: '/financing', query: { tab: 'insurance' } },
      ],
      feature: this.feature('Flexible Financing', 'Drive your dream with ease. Compare loan options, estimate your monthly payments and find a plan that fits your budget before you commit.'),
    },
    {
      key: 'buycar',
      label: 'Showroom',
      title: 'Buy Car',
      links: [
        { label: 'All Cars', path: '/store' },
        { label: 'New Cars', path: '/store' },
        { label: 'Import', path: '/imported-trade-in', query: { tab: 'import' } },
        { label: 'Trade-in', path: '/imported-trade-in', query: { tab: 'trade-in' } },
      ],
      feature: this.feature('Import or Trade In With Ease', 'Bring in your dream car from abroad or trade in your current one for a fair valuation, with every step handled for you.'),
    },
    {
      key: 'subsidiaries',
      label: 'Subsidiaries',
      title: 'Our Subsidiaries',
      links: [
        { label: 'A Plus Motors' },
        { label: 'A Plus Finance' },
        { label: 'A Plus Insurance' },
        { label: 'A Plus Auto Parts' },
      ],
      feature: this.feature('Building a Bigger Future', 'Our group brings together motors, finance, insurance and auto parts under one roof, so every part of owning a car is handled by a partner you trust.'),
    },
  ];

  /** Every feature opens the blog. */
  private feature(title: string, text: string): MenuFeature {
    const words = text.trim().split(/\s+/);
    const long = words.length > this.featureWordLimit;
    return {
      title,
      text: long ? words.slice(0, this.featureWordLimit).join(' ').replace(/[,.;:]+$/, '') + '...' : text,
      image: this.car1,
      long,
      path: '/blogs',
    };
  }

  ngAfterViewInit(): void {
    const el = this.searchTag?.nativeElement;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = this.searchHints[0];
      return;
    }
    // Runs outside Angular and writes straight to the element, so typing never triggers change detection.
    this.zone.runOutsideAngular(() => {
      this.hintTyper = new Typewriter({
        phrases: this.searchHints,
        render: text => { el.textContent = text; },
        // pauses while the search overlay is open (the overlay has its own typing)
        canRun: () => !this.searchWindowOpened,
      });
      this.hintTyper.start();
    });
  }

  ngOnDestroy(): void {
    this.hintTyper?.stop();
  }

  trackByKey(_: number, item: MenuItem): string {
    return item.key;
  }

  toggleSubmenu(menu: string, event?: Event): void {
    if (event) event.preventDefault();
    if (this.activeSubmenu !== menu) {
      this.activeSubmenu = menu;
    }
  }
  /** Navigates and closes the menu so the page opens full view (works for desktop and mobile). */
  go(target: MenuTarget): void {
    if (!target.path) return;
    this.router.navigate([target.path], target.query ? { queryParams: target.query } : {});
    if (this.isMenuOpen) {
      this.toggleMenuEvent.emit();
    }
  }

  openSearch(): void { this.openSearchEvent.emit(); }
  closeSearch(event: Event): void { this.closeSearchEvent.emit(event); }

  goHome(): void {
    this.activeSubmenu = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (this.isMenuOpen) {
      this.isMenuOpen = !this.isMenuOpen;
    }
    if (this.searchWindowOpened) {
      this.searchWindowOpened = false;
    }
  }

  toggleMenu(): void { this.toggleMenuEvent.emit(); }
  toggleChat(): void { this.toggleChatEvent.emit(); }

  goToImport()   { this.go({ path: '/imported-trade-in', query: { tab: 'import' } }); }
  goToTradeIn()  { this.go({ path: '/imported-trade-in', query: { tab: 'trade-in' } }); }
  goToStore()    { this.go({ path: '/store' }); }
  goToBlogs()    { this.go({ path: '/blogs' }); }
  goToAbout()    { this.go({ path: '/about-us' }); }
  gototContacts(){ this.go({ path: '/contact' }); }
}