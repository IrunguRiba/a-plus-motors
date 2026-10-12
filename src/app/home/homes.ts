import { Component, inject, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
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
export class Home implements OnInit, AfterViewInit {
  cookiesClicked = false;
  searchWindowOpened = false;
  isChatOpen = false;
  isMenuOpen = false;
  logoImg = 'fav3.png';

  private smoother!: ScrollSmoother;

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
    gsap.from('#smooth-content', {
      opacity: 0, y: 25, scale: 0.99, duration: 1.2, ease: 'power3.out', delay: 0.1
    });
  }

  ngAfterViewInit(): void {
    this.smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.6,
      effects: true
    });
    document.addEventListener('click', () => this.closeDropdown());
  }

  hideCookies(): void { this.cookiesClicked = true; }
  openSearch(): void { this.searchWindowOpened = true; }
  closeSearch(event: Event): void { event.stopPropagation(); this.searchWindowOpened = false; }
  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }
  toggleChat(): void { this.isChatOpen = !this.isChatOpen; }

  goHome(): void {
    if (this.smoother) {
      this.smoother.scrollTo(0, true, 'power2.inOut');
      gsap.fromTo('#smooth-content',
        { opacity: 0.94, scale: 0.995 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', clearProps: 'opacity,transform' }
      );
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
}