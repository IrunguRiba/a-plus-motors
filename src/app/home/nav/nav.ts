import { Component, EventEmitter, Input, Output, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Search } from '../search/search';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [Search, CommonModule],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {

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

  // ── Assets ──
  email = 'gmail.png';
  ig = 'ig.png';
  twitter = 'twitter.png';
  whatsapp = 'whatsapp.png';
  facebook = 'facebook.png';
  phone = 'call.png';
  youtube = 'youtube.png';
  car1 = '1.png';

  // ── Submenu state (was in Menu) ──
  activeSubmenu: string = 'home';

  toggleSubmenu(menu: string, event?: Event): void {
    if (event) event.preventDefault();
    this.activeSubmenu = this.activeSubmenu === menu ? '' : menu;
  }

  // ── Event pass-throughs ──
  openSearch(): void { this.openSearchEvent.emit(); }
  closeSearch(event: Event): void { this.closeSearchEvent.emit(event); }
  goHome(): void {
    this.activeSubmenu = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if(this.isMenuOpen){
this.isMenuOpen=!this.isMenuOpen
    }
    if (this.searchWindowOpened) {
      this.searchWindowOpened = false;
    }

  
  
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
  toggleMenu(): void { this.toggleMenuEvent.emit(); }
  toggleChat(): void { this.toggleChatEvent.emit(); }

  // ── Navigation helpers (were in Menu) ──
  goToStore()    { this.router.navigate(['/store']); }
  goToFinance()  { this.router.navigate(['/financing']); }
  goToBlogs()    { this.router.navigate(['/blogs']); }
  goToAbout()    { this.router.navigate(['/about-us']); }
  gototContacts(){ this.router.navigate(['/contact']); }
}