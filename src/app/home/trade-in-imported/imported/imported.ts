import { Component } from '@angular/core';
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
export class Imported {

 
// Keep countries as strings so line 54 doesn't break
countries = ['Japan', 'United Kingdom', 'UAE', 'South Africa'];

// Map country names to their flag CDN URLs
private flagMap: { [key: string]: string } = {
  'Japan': 'https://flagcdn.com/w40/jp.png',
  'United Kingdom': 'https://flagcdn.com/w40/gb.png',
  'UAE': 'https://flagcdn.com/w40/ae.png',
  'South Africa': 'https://flagcdn.com/w40/za.png'
};

getFlag(country: string): string {
  return this.flagMap[country] || '';
}
  fuels = ['Petrol', 'Diesel', 'Hybrid'];
  makes = ['Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Isuzu', 'Volkswagen', 'Mercedes-Benz', 'BMW', 'Land Rover', 'Audi', 'Ford'];
  years = Array.from({ length: 9 }, (_, i) => new Date().getFullYear() - i);

  specs = [
    { k: 'Sourcing', v: 'Japan · UK · UAE · South Africa' },
    { k: 'Vehicle age', v: 'Up to 8 years from manufacture' },
    { k: 'We handle', v: 'Shipping, KRA duty, KEBS, registration' },
    { k: 'You get', v: 'An inspection report before you commit' },
  ];

  steps = [
    { n: '01', t: 'Brief', d: 'Tell us the car, spec and budget.', m: 'Day 0' },
    { n: '02', t: 'Source & inspect', d: 'We find verified stock and send a full inspection report.', m: 'Aprox. Week 1' },
    { n: '03', t: 'Ship', d: 'Booked, insured and tracked to Mombasa.', m: 'Aprox. Weeks 2–6' },
    { n: '04', t: 'Clear', d: 'KRA duty, KEBS inspection and registration, handled.', m: 'Aprox. Week 7' },
    { n: '05', t: 'Deliver', d: 'Plated and delivered to your yard or door.', m: 'Aprox. Week 8' },
  ];

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

  submit(): void {
    this.submitted = true;
  }
}