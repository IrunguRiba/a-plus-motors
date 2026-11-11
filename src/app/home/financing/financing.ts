import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiServices } from '../../services/api-services';
import { StoreCar } from '../../interfaces/car-interface';

type FinancingTab = 'options' | 'calculator' | 'apply' | 'insurance';
type ApplyType = 'individual' | 'company';
type CarLink = { id: string; url: string };

@Component({
  selector: 'app-financing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financing.html',
  styleUrl: './financing.css',
})
export class Financing implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiServices);
  private carsSub?: Subscription;
  private querySub?: Subscription;

  whatsappNumber = '254707555666';

  private allCars: StoreCar[] = [];

  ngOnInit(): void {
    this.carsSub = this.api.getStoreCars().subscribe({
      next: list => {
        this.allCars = list;
        // If a car link was already entered before cars loaded, apply it now
        if (this.calcCarLink) this.applyCalcLink();
      },
      error: () => { }
    });

    this.querySub = this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab') as FinancingTab | null;
      const valid: FinancingTab[] = ['options', 'calculator', 'apply', 'insurance'];
      if (tab && valid.includes(tab) && tab !== this.activeTab) {
        if (this.submitted) this.resetForms();
        this.attempted = false;
        this.activeTab = tab;
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  ngOnDestroy(): void {
    this.carsSub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  // ---------- Tabs ----------
  activeTab: FinancingTab = 'options';

  tabs: { id: FinancingTab; label: string }[] = [
    { id: 'options', label: 'Loan Options' },
    { id: 'calculator', label: 'Calculate Payments' },
    { id: 'apply', label: 'Apply Now' },
    { id: 'insurance', label: 'Insurance Partners' }
  ];

  setActiveTab(tab: FinancingTab): void {
    if (tab === this.activeTab) return;
    if (this.submitted) this.resetForms();
    this.attempted = false;
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Loan options ----------
  terms = [
    { label: 'Interest rate', value: 'From 13% p.a. (reducing balance)' },
    { label: 'Installments', value: 'Flexible monthly, up to 48 months' },
    { label: 'Used saloon / pick-up / cargo', value: 'Up to 80% · max 48 months' },
    { label: 'Brand new', value: 'Up to 80% · max 5 years' }
  ];

  banks1 = [
    { name: 'Equity', logo: 'equity.png' },
    { name: 'KCB', logo: 'kcb.png' },
    { name: 'Stanbic', logo: 'stanbic.png' },
    { name: 'NIC', logo: 'nic.png' },
  ];

  banks2 = [
    { name: 'Co-op', logo: 'coop.png' },
    { name: 'KWFT', logo: 'kwft.png' },
    { name: 'Family', logo: 'family.png' },
    { name: 'Unitas', logo: 'unitas.png' },
    { name: 'Spire', logo: 'spire.png' },
  ];

  get allBanks() { return [...this.banks1, ...this.banks2]; }

  individualRequirements: string[] = [
    'Complete the loan application form',
    '6 months (latest) original bank statements',
    'Copy of PIN and national ID',
    '3 months current payslips (if employed)',
    'Original KRA search certificate for used vehicles',
    'Original market valuation report'
  ];

  companyRequirements: string[] = [
    '6 months current bank statements',
    'Audited accounts for the last 3 years',
    'Copy of PIN and certificate of incorporation / registration',
    'Board resolution',
    'Memo & articles of association'
  ];

  // ---------- Calculator ----------
  calc = { type: 'new' as 'new' | 'used', price: 3000000, depositPct: 20, months: 48, rate: 13 };
  calcCarLink = '';

  get monthsOptions(): number[] {
    return this.calc.type === 'new' ? [12, 24, 36, 48, 60] : [12, 24, 36, 48];
  }

  setCalcType(type: 'new' | 'used'): void {
    this.calc.type = type;
    if (type === 'used' && this.calc.months > 48) this.calc.months = 48;
  }

  get priceValue(): number { return Math.max(0, Number(this.calc.price) || 0); }
  get depositValue(): number { return Math.min(Math.max(Number(this.calc.depositPct) || 20, 20), 100); }
  get depositFill(): number { return Math.min(Math.max(((this.depositValue - 20) / 50) * 100, 0), 100); }
  get deposit(): number { return this.priceValue * (this.depositValue / 100); }
  get loanAmount(): number { return this.priceValue - this.deposit; }

  get monthly(): number {
    const n = this.calc.months;
    const r = Math.max(0, Number(this.calc.rate) || 0) / 100 / 12;
    if (this.loanAmount <= 0 || n <= 0) return 0;
    if (r === 0) return this.loanAmount / n;
    return (this.loanAmount * r) / (1 - Math.pow(1 + r, -n));
  }

  get totalPayable(): number { return this.monthly * this.calc.months; }
  get totalInterest(): number { return Math.max(0, this.totalPayable - this.loanAmount); }
  get principalShare(): number {
    return this.totalPayable > 0 ? (this.loanAmount / this.totalPayable) * 100 : 100;
  }

  money(n: number): string {
    return 'Ksh ' + Math.round(n).toLocaleString('en-KE');
  }

  // ---------- Car link in calculator ----------
  get calcLink(): CarLink | null { return this.parseCarLink(this.calcCarLink); }

  get calcCar(): StoreCar | undefined {
    const link = this.calcLink;
    return link ? this.carFor(link) : undefined;
  }

  onCalcCarLinkChange(): void {
    const car = this.calcCar;
    if (!car) return;
    const numeric = this.parsePriceToNumber(car.price);
    if (numeric > 0) {
      this.calc.price = numeric;
      this.cdr.detectChanges();
    }
  }

  clearCalcVehicle(): void {
    this.calcCarLink = '';
    this.calc.price = 3000000;
    this.cdr.detectChanges();
  }

  private parsePriceToNumber(price: string | number | undefined | null): number {
    if (price == null) return 0;
    if (typeof price === 'number') return price;
    const digits = String(price).replace(/[^\d.]/g, '');
    const n = parseFloat(digits);
    return isNaN(n) ? 0 : n;
  }

  // Called after cars load to apply a pending link
  private applyCalcLink(): void {
    const car = this.calcCar;
    if (!car) return;
    const numeric = this.parsePriceToNumber(car.price);
    if (numeric > 0) {
      this.calc.price = numeric;
      this.cdr.detectChanges();
    }
  }

  figures: {
    condition: string; price: number; depositPct: number; deposit: number;
    loan: number; months: number; rate: number; monthly: number;
  } | null = null;

  applyWithFigures(): void {
    if (this.loanAmount <= 0) return;
    const period = this.calc.months === 60 ? '60 months (new vehicles)' : `${this.calc.months} months`;
    const amount = Math.round(this.loanAmount).toLocaleString('en-KE');

    this.figures = {
      condition: this.calc.type === 'new' ? 'brand new' : 'used',
      price: this.priceValue,
      depositPct: this.depositValue,
      deposit: this.deposit,
      loan: this.loanAmount,
      months: this.calc.months,
      rate: Math.max(0, Number(this.calc.rate) || 0),
      monthly: this.monthly
    };

    if (this.activeTab !== 'apply') this.setActiveTab('apply');

    this.indForm.amount = amount;
    this.bizForm.amount = amount;
    this.indForm.period = period;
    this.bizForm.period = period;

    // Carry the calculator car link into the application form if present
    const link = this.calcLink;
    if (link) {
      this.indForm.vehicle = link.url;
      this.bizForm.vehicle = link.url;
    }

    this.cdr.detectChanges();
  }

  clearFigures(): void { this.figures = null; }

  private figuresLines(): string[] {
    const f = this.figures;
    if (!f) return [];
    return [
      `Calculator (${f.condition} vehicle): price ${this.money(f.price)}, deposit ${f.depositPct}% (${this.money(f.deposit)}), loan ${this.money(f.loan)} over ${f.months} months at ${f.rate}% - est. ${this.money(f.monthly)}/month`
    ];
  }

  // ---------- Application forms ----------
  applyType: ApplyType = 'individual';
  attempted = false;
  submitted = false;

  employmentTypes = ['Employed', 'Self-employed', 'Other'];
  periods = ['12 months', '24 months', '36 months', '48 months', '60 months (new vehicles)'];

  indForm = { name: '', phone: '', email: '', idNumber: '', employment: '', vehicle: '', amount: '', period: '' };
  bizForm = { company: '', contact: '', phone: '', email: '', pin: '', vehicle: '', amount: '', period: '' };

  private phoneOk(v: string): boolean { return /^\+?[\d\s-]{9,16}$/.test(v.trim()); }
  private emailOk(v: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  get indNameOk(): boolean { return this.indForm.name.trim().length >= 2; }
  get indPhoneOk(): boolean { return this.phoneOk(this.indForm.phone); }
  get indEmailOk(): boolean { return this.emailOk(this.indForm.email); }
  get indVehicleOk(): boolean { return this.indForm.vehicle.trim().length >= 2; }
  get indPeriodOk(): boolean { return !!this.indForm.period; }

  get bizCompanyOk(): boolean { return this.bizForm.company.trim().length >= 2; }
  get bizContactOk(): boolean { return this.bizForm.contact.trim().length >= 2; }
  get bizPhoneOk(): boolean { return this.phoneOk(this.bizForm.phone); }
  get bizEmailOk(): boolean { return this.emailOk(this.bizForm.email); }
  get bizVehicleOk(): boolean { return this.bizForm.vehicle.trim().length >= 2; }
  get bizPeriodOk(): boolean { return !!this.bizForm.period; }

  get formValid(): boolean {
    return this.applyType === 'company'
      ? this.bizCompanyOk && this.bizContactOk && this.bizPhoneOk && this.bizEmailOk && this.bizVehicleOk && this.bizPeriodOk
      : this.indNameOk && this.indPhoneOk && this.indEmailOk && this.indVehicleOk && this.indPeriodOk;
  }

  get currentRequirements(): string[] {
    return this.applyType === 'company' ? this.companyRequirements : this.individualRequirements;
  }

  get applicantName(): string {
    return this.applyType === 'company' ? this.bizForm.contact.trim() : this.indForm.name.trim();
  }

  // ---------- Car link parsing (shared) ----------
  private parseCarLink(value: string): CarLink | null {
    const text = value.trim();
    let candidate = '';
    if (/^https?:\/\//i.test(text)) candidate = text;
    else if (/^[\w.-]+(:\d+)?\/specs\?/i.test(text)) candidate = 'http://' + text;
    if (!candidate) return null;
    try {
      const u = new URL(candidate);
      const id = u.searchParams.get('id');
      if (id && /specs/i.test(u.pathname)) return { id, url: u.toString() };
    } catch { }
    return null;
  }

  get indLink(): CarLink | null { return this.parseCarLink(this.indForm.vehicle); }
  get bizLink(): CarLink | null { return this.parseCarLink(this.bizForm.vehicle); }

  carFor(link: CarLink): StoreCar | undefined {
    return this.allCars.find(c => String(c.id) === link.id);
  }

  clearVehicle(): void {
    if (this.applyType === 'company') this.bizForm.vehicle = '';
    else this.indForm.vehicle = '';
  }

  private vehicleLines(text: string): string[] {
    const link = this.parseCarLink(text);
    if (!link) return [`Vehicle: ${text.trim()}`];
    const car = this.carFor(link);
    return [
      `Vehicle: ${car ? `${car.year} ${car.make} ${car.name}` : 'See link below'}`,
      `Car link: ${link.url}`
    ];
  }

  get waLink(): string {
    let lines: string[];
    if (this.applyType === 'company') {
      const f = this.bizForm;
      lines = [
        `Hello A Plus Motors, I'd like to apply for business vehicle financing.`,
        `Company: ${f.company.trim()}`,
        `Contact: ${f.contact.trim()}`,
        `Phone: ${f.phone.trim()}`,
        `Email: ${f.email.trim()}`,
        f.pin.trim() ? `KRA PIN: ${f.pin.trim()}` : '',
        ...this.vehicleLines(f.vehicle),
        f.amount.trim() ? `Loan amount: Ksh ${f.amount.trim()}` : '',
        `Repayment period: ${f.period}`,
        ...this.figuresLines()
      ];
    } else {
      const f = this.indForm;
      lines = [
        `Hello A Plus Motors, I'd like to apply for vehicle financing.`,
        `Name: ${f.name.trim()}`,
        `Phone: ${f.phone.trim()}`,
        `Email: ${f.email.trim()}`,
        f.idNumber.trim() ? `National ID: ${f.idNumber.trim()}` : '',
        f.employment ? `Employment: ${f.employment}` : '',
        ...this.vehicleLines(f.vehicle),
        f.amount.trim() ? `Loan amount: Ksh ${f.amount.trim()}` : '',
        `Repayment period: ${f.period}`,
        ...this.figuresLines()
      ];
    }
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`;
  }

  setApplyType(type: ApplyType): void {
    if (type === this.applyType) return;
    if (this.submitted) this.resetForms();
    this.attempted = false;
    this.applyType = type;
  }

  submitApplication(): void {
    this.attempted = true;
    if (!this.formValid) return;
    this.submitted = true;
    this.cdr.detectChanges();
    document.querySelector('.fn-done')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  private resetForms(): void {
    this.indForm = { name: '', phone: '', email: '', idNumber: '', employment: '', vehicle: '', amount: '', period: '' };
    this.bizForm = { company: '', contact: '', phone: '', email: '', pin: '', vehicle: '', amount: '', period: '' };
    this.attempted = false;
    this.submitted = false;
  }

  // ---------- Insurance ----------
  coverTypes = [
    { icon: 'verified_user', title: 'Comprehensive', text: 'Covers your vehicle against accident damage, theft and fire, plus liability to others. The usual choice for a financed car.' },
    { icon: 'groups', title: 'Third party only', text: 'The minimum legal cover. Pays for injury or damage you cause to other people and their property.' },
    { icon: 'local_fire_department', title: 'Third party, fire & theft', text: 'Third-party cover with added protection if your vehicle is stolen or damaged by fire.' }
  ];

  insurers = [
    { name: 'Jubilee Insurance', short: 'JI', domain: 'jubileeinsurance.com' },
    { name: 'CIC Insurance', short: 'CIC', domain: 'cic.co.ke' },
    { name: 'Britam', short: 'BR', domain: 'britam.com' },
    { name: 'APA Insurance', short: 'APA', domain: 'apainsurance.org' },
    { name: 'Madison Insurance', short: 'MI', domain: 'madison.co.ke' },
    { name: 'UAP Old Mutual', short: 'UOM', domain: 'oldmutual.com' }
  ];

  logoFor(domain: string): string {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  hideImg(event: Event): void {
    (event.target as HTMLElement).style.display = 'none';
  }

  get insuranceLink(): string {
    const text = `Hello A Plus Motors, I'd like an insurance quote for a vehicle I'm financing.`;
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  // ---------- Navigation ----------
  goHome(): void { this.router.navigate(['']); }
  goToStore(): void { this.router.navigate(['/store']); }

  goToImport(): void {
    this.router.navigate(['/imported-trade-in'], { queryParams: { tab: 'import' } });
  }

  goToTradeIn(): void {
    this.router.navigate(['/imported-trade-in'], { queryParams: { tab: 'trade-in' } });
  }
}