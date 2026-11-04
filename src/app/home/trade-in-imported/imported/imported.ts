import { Component, HostListener, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Row {
  label: string;
  value: number;
  strong?: boolean;
}

const SHIPPING_RATE = 0.075;
const IMPORT_DUTY = 0.25;
const EXCISE_DUTY = 0.2;
const VAT = 0.16;
const IDF = 0.025;
const RDL = 0.02;

@Component({
  selector: 'app-imported',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './imported.html',
  styleUrl: './imported.css',
})
export class Imported implements OnDestroy {
  countries = ['Japan', 'United Kingdom', 'UAE', 'South Africa'];

  fuels = ['Petrol', 'Diesel', 'Hybrid'];
  makes = ['Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Isuzu', 'Volkswagen', 'Mercedes-Benz', 'BMW', 'Land Rover', 'Audi', 'Ford'];
  years = Array.from({ length: 9 }, (_, i) => new Date().getFullYear() - i);

  specs = [
    { k: 'Sourcing', v: 'Japan · UK · UAE · South Africa', tag: 'Transportation supported' },
    { k: 'Vehicle age', v: 'Up to 8 years from manufacture', tag: '' },
    { k: 'We handle', v: 'Shipping, KRA duty, KEBS, registration', tag: 'Timely delivery.' },
    { k: 'You get', v: 'An inspection report before you commit', tag: 'Free inspection.' },
  ];

  steps = [
    { 
      n: '01', 
      t: 'Brief', 
      d: 'Tell us the car you want and we confirm it is eligible.', 
      m: 'Approx. 1 Week', 
      thumb: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop', // Team meeting/briefing
      video: 'assets/steps/brief.mp4' 
    },
    { 
      n: '02', 
      t: 'Source & inspect', 
      d: 'We find the car overseas and send an inspection report before you commit.', 
      m: 'Approx. 1 Week', 
      thumb: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800&auto=format&fit=crop', // Car inspection
      video: 'assets/steps/source.mp4' 
    },
    { 
      n: '03', 
      t: 'Ship', 
      d: 'Your car is shipped to Mombasa.', 
      m: 'Approx. 2–6 Weeks', 
      thumb: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=800&auto=format&fit=crop', // Cargo ship
      video: 'assets/steps/ship.mp4' 
    },
    { 
      n: '04', 
      t: 'Clear & deliver', 
      d: 'We clear it through KRA and KEBS, register it and hand you the keys.', 
      m: 'Approx. 7–8 Weeks', 
      thumb: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=800&auto=format&fit=crop', // Handing over keys
      video: 'assets/steps/deliver.mp4' 
    },
  ];

  videoOpen = false;
  videoSrc = 'assets/hero.mp4';
  // Replaced hero thumbnail with a high-quality car image
  videoThumb = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1200&auto=format&fit=crop';
  activeSrc = this.videoSrc;
  activeThumb = this.videoThumb;
  openStep = -1;

  faqs = [
    { q: 'How old can an imported car be?', a: 'Kenya generally allows used vehicles up to 8 years from the year of manufacture. We confirm eligibility for the exact car before you commit to anything.' },
    { q: 'How long does it take?', a: 'About eight weeks from brief to delivery: sourcing and inspection in week 1, shipping in weeks 2–6, clearing in week 7 and delivery in week 8.' },
    { q: 'How accurate is the cost estimate?', a: 'It is indicative only. Final duty is based on the KRA valuation and the rates in force when the car is entered, so your formal quote may differ.' },
    { q: 'Can I finance an import?', a: 'Ask us about financing when you request your quote and we will walk you through the options.' },
  ];

  origin = 'Japan';
  make = 'Toyota';
  model = 'Harrier';
  year = 2025;
  fuel = 'Petrol';
  engine = '1,998';
  price = 2400000;
  priceText = '2,400,000';
  name = '';
  phone = '';
  email = '';
  notes = '';
  openFaq = 0;
  submitted = false;
  tried = false;

  get shipping(): number { return Math.round(this.price * SHIPPING_RATE); }
  get cif(): number { return this.price + this.shipping; }
  get importDuty(): number { return Math.round(this.cif * IMPORT_DUTY); }
  get excise(): number { return Math.round((this.cif + this.importDuty) * EXCISE_DUTY); }
  get vat(): number { return Math.round((this.cif + this.importDuty + this.excise) * VAT); }
  get idf(): number { return Math.round(this.cif * IDF); }
  get rdl(): number { return Math.round(this.cif * RDL); }
  get total(): number { return this.cif + this.importDuty + this.excise + this.vat + this.idf + this.rdl; }

  get rows(): Row[] {
    return [
      { label: 'Vehicle price (FOB)', value: this.price },
      { label: 'Shipping & insurance', value: this.shipping },
      { label: 'CIF value', value: this.cif, strong: true },
      { label: 'Import duty · 25%', value: this.importDuty },
      { label: 'Excise duty · 20%', value: this.excise },
      { label: 'VAT · 16%', value: this.vat },
      { label: 'IDF · 2.5%', value: this.idf },
      { label: 'RDL · 2%', value: this.rdl },
      { label: 'Total landed (est.)', value: this.total, strong: true },
    ];
  }

  onPrice(value: string): void {
    this.price = Number(value.replace(/\D/g, '')) || 0;
    this.priceText = this.price ? this.price.toLocaleString('en-US') : '';
  }

  toForm(): void {
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth' });
  }

  openVideo(src: string = this.videoSrc, thumb: string = this.videoThumb): void {
    this.activeSrc = src;
    this.activeThumb = thumb;
    this.videoOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeVideo(): void {
    this.videoOpen = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.videoOpen) {
      this.closeVideo();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  attempt(valid: boolean | null): void {
    this.tried = true;
    if (valid) {
      this.submit();
    }
  }

  submit(): void {
    this.submitted = true;
  }
}