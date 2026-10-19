import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';


const REFERENCE_YEAR = 2021;
const ANNUAL_DEPRECIATION = 0.08;
const KM_PER_YEAR = 15000;
const RANGE_SPREAD = 0.0616;

const CATALOGUE: Record<string, Record<string, number>> = {
  Toyota: { Harrier: 2590000, Prado: 5200000, Fielder: 1150000 },
  Nissan: { 'X-Trail': 2100000, Note: 900000 },
  Mazda: { 'CX-5': 2800000, Demio: 850000 },
  Honda: { Vezel: 1900000, Fit: 950000 },
  Subaru: { Forester: 2400000, Impreza: 1300000 },
};

const CONDITION_ADJUSTMENT: Record<string, number> = { Excellent: 4, Good: 0, Fair: -6, 'Needs work': -15 };

const round10k = (n: number): number => Math.round(n / 10000) * 10000;

@Component({
  selector: 'app-trade-in',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './trade-in.html',
  styleUrl: './trade-in.css',
})
export class TradeIn {
  makes = Object.keys(CATALOGUE);
  years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);
  transmissions = ['Automatic', 'Manual', 'CVT'];
  fuels = ['Petrol', 'Diesel', 'Hybrid', 'EV'];
  conditions = [
    { name: 'Excellent', hint: 'Like new' },
    { name: 'Good', hint: 'Normal wear' },
    { name: 'Fair', hint: 'Visible wear' },
    { name: 'Needs work', hint: 'Repairs due' },
  ];
  upgrades = [
    { name: 'Mazda CX-5 2020', price: 3650000 },
    { name: 'Toyota Harrier 2022', price: 4150000 },
    { name: 'Subaru Forester 2021', price: 3200000 },
  ];
  times = ['09:00', '11:00', '14:00', '16:00'];
  days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    };
  });

  specs = [
    { k: 'Offer basis', v: 'Year, mileage, condition and market demand' },
    { k: 'Inspection', v: 'A short in-person check at our yard' },
    { k: 'Car on loan?', v: 'We can settle the balance for you' },
    { k: 'Paperwork', v: 'Logbook transfer handled by us' },
  ];

  features = ['Instant range', 'Free inspection', 'Logbook transfer', 'Loan settlement', 'Same-day swap'];

  steps = [
    { n: '01', t: 'Describe', d: 'Tell us about your car in two minutes.', m: '2 min' },
    { n: '02', t: 'Get a range', d: 'See an indicative offer instantly, no sign-up.', m: 'Instant' },
    { n: '03', t: 'Inspect', d: 'Book a slot. We check the car and confirm the number.', m: 'At our yard' },
    { n: '04', t: 'Swap', d: 'Pick your next car. We handle the paperwork.', m: 'Same day' },
  ];

  benefits = [
    { n: '01', t: 'A number you can plan around', d: 'See a realistic range before you leave your sofa.' },
    { n: '02', t: 'One handover, not five trips', d: 'Valuation, paperwork and your next car in one visit.' },
    { n: '03', t: 'Loans are not a blocker', d: 'We can clear what you still owe on the car you are trading.' },
  ];

  faqs = [
    { q: 'How is my offer calculated?', a: 'We start from the market value for your model and year, then adjust for mileage and condition. The range you see is indicative; the final offer is confirmed after inspection.' },
    { q: 'Can I trade in a car that is still on finance?', a: 'Yes. We can clear what you still owe on the car you are trading.' },
    { q: 'What should I bring to the inspection?', a: 'Bring your logbook, your ID and the car keys.' },
    { q: 'Am I obliged to accept the final offer?', a: 'No. The inspection is free, with no obligation to trade in or buy.' },
  ];

  make = 'Toyota';
  model = 'Harrier';
  year = 2021;
  mileage = 42000;
  mileageText = '42,000';
  transmission = 'Automatic';
  fuel = 'Petrol';
  condition = 'Good';
  photos: (string | null)[] = [null, null, null, null, null, null];
  upgrade = 'Mazda CX-5 2020';
  dayIndex = 1;
  time = '11:00';
  name = '';
  phone = '';
  openFaq = 0;
  submitted = false;

  get modelsForMake(): string[] { return Object.keys(CATALOGUE[this.make] ?? {}); }
  get age(): number { return Math.max(0, new Date().getFullYear() - this.year); }

  get market(): number {
    const ref = CATALOGUE[this.make]?.[this.model] ?? 0;
    return round10k(Math.max(0, ref * (1 - ANNUAL_DEPRECIATION * (this.year - REFERENCE_YEAR))));
  }

  get mileagePct(): number {
    const pct = ((KM_PER_YEAR * this.age - this.mileage) / 1000) * 0.2;
    return Math.max(-20, Math.min(10, Math.round(pct * 10) / 10));
  }

  get conditionPct(): number { return CONDITION_ADJUSTMENT[this.condition] ?? 0; }
  get mileageAmount(): number { return round10k((this.market * this.mileagePct) / 100); }
  get conditionAmount(): number { return round10k((this.market * this.conditionPct) / 100); }
  get offer(): number { return this.market + this.mileageAmount + this.conditionAmount; }
  get low(): number { return round10k(this.offer * (1 - RANGE_SPREAD)); }
  get high(): number { return round10k(this.offer * (1 + RANGE_SPREAD)); }

  get selectedUpgrade(): { name: string; price: number } | undefined {
    return this.upgrades.find((u) => u.name === this.upgrade);
  }

  get balance(): number { return (this.selectedUpgrade?.price ?? 0) - this.offer; }

  millions(n: number): string { return (n / 1000000).toFixed(2); }

  pct(n: number): string { return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`; }

  signed(n: number): string {
    return `${n >= 0 ? '+' : '−'} ${Math.abs(n).toLocaleString('en-US')}`;
  }

  onMake(): void {
    this.model = this.modelsForMake[0];
  }

  onMileage(value: string): void {
    this.mileage = Number(value.replace(/\D/g, '')) || 0;
    this.mileageText = this.mileage ? this.mileage.toLocaleString('en-US') : '';
  }

  onPhoto(index: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => (this.photos[index] = reader.result as string);
    reader.readAsDataURL(file);
  }

  toForm(): void {
    document.getElementById('value')?.scrollIntoView({ behavior: 'smooth' });
  }

  submit(): void {
    this.submitted = true;
  }
}