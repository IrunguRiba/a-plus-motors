import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Nav } from '../nav/nav';
import { Imported } from './imported/imported';
import { TradeIn } from './trade-in/trade-in';

@Component({
  selector: 'app-trade-in-imported',
  imports: [RouterLink, Nav, Imported, TradeIn],
  templateUrl: './trade-in-imported.html',
  styleUrl: './trade-in-imported.css',
})
export class TradeInImported implements AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Fraction of footer height revealed before hiding the tabs bar. */
  private static readonly HIDE_AT_FOOTER_REVEAL = 0.41;

  /** Bound to `[class.is-visible]` on `.tabs-wrapper`. */
  tabsVisible = true;

  private lastScrollSync = 0;

  logoImg = 'fav3.png';
  isMenuOpen = false;
  searchWindowOpened = false;

  active = toSignal(
    this.route.queryParamMap.pipe(map((p) => (p.get('tab') === 'trade-in' ? 'trade-in' : 'import'))),
    { initialValue: 'import' }
  );

  tabs = [
    { n: '', label: 'Import', key: 'import' },
    { n: '', label: 'Trade in', key: 'trade-in' },
  ];

  constructor() {
    effect(() => {
      this.active();
      queueMicrotask(() => this.syncTabsVisibility());
    });
  }

  private syncTabsVisibility(): void {
    const vh = window.innerHeight || document.documentElement.clientHeight;

    let footerPastThreshold = false;
    const footer = this.hostRef.nativeElement.querySelector('app-footer') as HTMLElement | null;
    if (footer) {
      const f = footer.getBoundingClientRect();
      const visibleHeight = Math.min(vh, f.bottom) - Math.max(0, f.top);
      const requiredReveal = f.height * TradeInImported.HIDE_AT_FOOTER_REVEAL;

      if (f.height > 0 && visibleHeight >= requiredReveal) {
        footerPastThreshold = true;
      }
    }

    const next = !footerPastThreshold;
    if (next !== this.tabsVisible) {
      this.tabsVisible = next;
      this.cdr.markForCheck();
    }
  }

  private onScrollSync = (): void => {
    const now = performance.now();
    if (now - this.lastScrollSync < 80) return;
    this.lastScrollSync = now;
    this.syncTabsVisibility();
  };

  ngAfterViewInit(): void {
    this.syncTabsVisibility();
    window.addEventListener('scroll', this.onScrollSync, { passive: true });
    window.addEventListener('resize', this.onScrollSync, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScrollSync);
    window.removeEventListener('resize', this.onScrollSync);
  }

  openSearch(): void {
    this.searchWindowOpened = true;
  }

  closeSearch(event: Event): void {
    event.stopPropagation();
    this.searchWindowOpened = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}