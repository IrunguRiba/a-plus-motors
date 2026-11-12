import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiServices } from '../../services/api-services';
import {
  StoreCar,
  FinancingTab,
  ApplyType,
  CarLink,
  FinancingInfo,
  LoanTerm,
  Bank,
  CalculatorState,
  CalculationFigures,
  IndividualApplication,
  CompanyApplication,
  CoverType,
  Insurer,
} from '../../interfaces/car-interface';

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
        if (this.calcCarLink) this.onCalcCarLinkChange();
      },
      error: () => { }
    });

    this.querySub = this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab') as FinancingTab | null;
      const valid: FinancingTab[] = ['options', 'calculator', 'apply', 'insurance'];
      if (tab && valid.includes(tab) && tab !== this.activeTab) {
        if (this.submitted && this.activeTab === 'apply' && tab !== 'apply') {
          this.resetForms();
          this.resetCalculator();
        }
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

    if (this.submitted && this.activeTab === 'apply' && tab !== 'apply') {
      this.resetForms();
      this.resetCalculator();
    }

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
  terms: LoanTerm[] = [
    { label: 'Interest rate', value: 'From 13% p.a. (reducing balance)' },
    { label: 'Installments', value: 'Flexible monthly, up to 48 months' },
    { label: 'Used saloon / pick-up / cargo', value: 'Up to 80% · max 48 months' },
    { label: 'Brand new', value: 'Up to 80% · max 5 years' }
  ];

  banks1: Bank[] = [
    { name: 'Equity', logo: 'equity.png' },
    { name: 'KCB', logo: 'kcb.png' },
    { name: 'Stanbic', logo: 'stanbic.png' },
    { name: 'NIC', logo: 'nic.png' },
  ];

  banks2: Bank[] = [
    { name: 'Co-op', logo: 'coop.png' },
    { name: 'KWFT', logo: 'kwft.png' },
    { name: 'Family', logo: 'family.png' },
    { name: 'Unitas', logo: 'unitas.png' },
    { name: 'Spire', logo: 'spire.png' },
  ];

  get allBanks(): Bank[] { return [...this.banks1, ...this.banks2]; }

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
  calc: CalculatorState = {
    type: 'new',
    price: 3000000,
    depositPct: 20,
    months: 48,
    rate: 13,
  };
  calcCarLink = '';

  linkedFinance: FinancingInfo | null = null;

  get monthsOptions(): number[] {
    return this.calc.type === 'new' ? [12, 24, 36, 48, 60] : [12, 24, 36, 48];
  }

  setCalcType(type: 'new' | 'used'): void {
    if (this.isCarLocked) return;
    this.calc.type = type;
    if (type === 'used' && this.calc.months > 48) this.calc.months = 48;
  }

  get isCarLocked(): boolean {
    return !!this.calcCar;
  }

  get isCarNotEligible(): boolean {
    return !!(this.linkedFinance && !this.linkedFinance.enabled);
  }

  get minDepositPct(): number {
    const finMin = this.linkedFinance?.deposit;
    return typeof finMin === 'number' ? Math.max(20, finMin) : 20;
  }

  get priceValue(): number { return Math.max(0, Number(this.calc.price) || 0); }
  get depositValue(): number {
    const min = this.minDepositPct;
    return Math.min(Math.max(Number(this.calc.depositPct) || min, min), 100);
  }
  get depositFill(): number {
    const min = this.minDepositPct;
    const span = 100 - min;
    const pct = span > 0 ? ((this.depositValue - min) / span) * 100 : 0;
    return Math.min(Math.max(pct, 0), 100);
  }
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

  onDepositChange(value: number): void {
    const min = this.minDepositPct;
    const clamped = Math.min(Math.max(Number(value) || min, min), 100);
    if (clamped !== this.calc.depositPct) {
      this.calc.depositPct = clamped;
    }
  }

  // ---------- Car link in calculator ----------
  get calcLink(): CarLink | null { return this.parseCarLink(this.calcCarLink); }

  get calcCar(): StoreCar | undefined {
    const link = this.calcLink;
    return link ? this.carFor(link) : undefined;
  }

  onCalcCarLinkChange(): void {
    const link = this.calcLink;
    if (!link) {
      this.linkedFinance = null;
      return;
    }
    this.api.getCarById(link.id).subscribe({
      next: raw => {
        if (!raw) {
          this.linkedFinance = null;
          return;
        }
        const price = this.parsePriceToNumber(raw.price);
        if (price > 0) this.calc.price = price;

        const f = raw.finance;
        const bankDetail = f?.bankDetails?.[0];

        this.linkedFinance = {
          enabled: !!(f?.enabled && f?.active),
          bank: bankDetail?.bank ?? f?.banks?.[0],
          bankFullName: f?.bankFullName ?? bankDetail?.fullName,
          bankLogo: f?.bankLogo ?? bankDetail?.logo,
          bankColor: f?.bankColor ?? bankDetail?.color,
          rate: f?.rate,
          deposit: f?.deposit,
          term: f?.term,
          monthly: f?.monthly,
          maxAmount: f?.maxAmount,
        };

        if (this.linkedFinance.enabled) {
          if (typeof f?.rate === 'number') this.calc.rate = f.rate;
          if (typeof f?.deposit === 'number') {
            this.calc.depositPct = Math.max(20, f.deposit);
          }
          if (typeof f?.term === 'number') {
            const opts = this.monthsOptions;
            const chosen = opts.reduce(
              (a, b) => Math.abs(b - f!.term!) < Math.abs(a - f!.term!) ? b : a,
              opts[0]
            );
            this.calc.months = chosen;
          }
          const age = new Date().getFullYear() - Number(raw.year || 0);
          this.calc.type = age <= 1 ? 'new' : 'used';
        }

        this.cdr.detectChanges();
      },
      error: () => { this.linkedFinance = null; }
    });
  }

  clearCalcVehicle(): void {
    this.resetCalculator();
    this.cdr.detectChanges();
  }

  private resetCalculator(): void {
    this.calcCarLink = '';
    this.linkedFinance = null;
    this.calc.price = 3000000;
    this.calc.depositPct = 20;
    this.calc.rate = 13;
    this.calc.months = 48;
    this.calc.type = 'new';
  }

  private parsePriceToNumber(price: string | number | undefined | null): number {
    if (price == null) return 0;
    if (typeof price === 'number') return price;
    const digits = String(price).replace(/[^\d.]/g, '');
    const n = parseFloat(digits);
    return isNaN(n) ? 0 : n;
  }

  figures: CalculationFigures | null = null;

  get figuresLocked(): boolean {
    return !!(this.figures && this.figures.notEligible);
  }

  get vehicleLocked(): boolean {
    return !!this.figures;
  }

  get canApply(): boolean {
    if (this.loanAmount <= 0) return false;
    return true;
  }

  applyWithFigures(): void {
    if (!this.canApply) return;

    if (this.isCarNotEligible) {
      const link = this.calcLink;
      if (link) {
        this.indForm.vehicle = link.url;
        this.bizForm.vehicle = link.url;
        this.applyFinanceCache.set(link.id, false);
      }

      this.figures = null;
      this.indForm.amount = '';
      this.bizForm.amount = '';
      this.indForm.period = '';
      this.bizForm.period = '';

      if (this.activeTab !== 'apply') this.setActiveTab('apply');
      this.cdr.detectChanges();
      return;
    }

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
      monthly: this.monthly,
    };

    if (this.activeTab !== 'apply') this.setActiveTab('apply');

    this.indForm.amount = amount;
    this.bizForm.amount = amount;
    this.indForm.period = period;
    this.bizForm.period = period;

    const link = this.calcLink;
    if (link) {
      this.indForm.vehicle = link.url;
      this.bizForm.vehicle = link.url;
    }

    this.cdr.detectChanges();
  }

  /**
   * User pressed Clear on the figures panel → drop the transferred figures,
   * clear the vehicle link the figures were tied to, and reset the calculator.
   */
  clearFigures(): void {
    this.figures = null;
    this.indForm.vehicle = '';
    this.bizForm.vehicle = '';
    this.indForm.amount = '';
    this.bizForm.amount = '';
    this.indForm.period = '';
    this.bizForm.period = '';
    this.resetCalculator();
    this.cdr.detectChanges();
  }

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

  indForm: IndividualApplication = {
    name: '', phone: '', email: '', idNumber: '',
    employment: '', vehicle: '', amount: '', period: '',
  };
  bizForm: CompanyApplication = {
    company: '', contact: '', phone: '', email: '',
    pin: '', vehicle: '', amount: '', period: '',
  };

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

  get indCarNotFinanced(): boolean {
    const link = this.indLink;
    if (!link) return false;
    if (this.figures) return false;
    const status = this.applyFinanceCache.get(link.id);
    return status === false;
  }

  get bizCarNotFinanced(): boolean {
    const link = this.bizLink;
    if (!link) return false;
    if (this.figures) return false;
    const status = this.applyFinanceCache.get(link.id);
    return status === false;
  }

  get indHideNumbers(): boolean { return this.indCarNotFinanced; }
  get bizHideNumbers(): boolean { return this.bizCarNotFinanced; }

  get indPeriodRequired(): boolean { return !this.indHideNumbers; }
  get bizPeriodRequired(): boolean { return !this.bizHideNumbers; }

  private applyFinanceCache = new Map<string, boolean>();

  get formValid(): boolean {
    return this.applyType === 'company'
      ? this.bizCompanyOk && this.bizContactOk && this.bizPhoneOk && this.bizEmailOk &&
        this.bizVehicleOk && (!this.bizPeriodRequired || this.bizPeriodOk)
      : this.indNameOk && this.indPhoneOk && this.indEmailOk &&
        this.indVehicleOk && (!this.indPeriodRequired || this.indPeriodOk);
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

  onApplyVehicleChange(form: 'individual' | 'company'): void {
    if (this.figures) return;
    const f = form === 'company' ? this.bizForm : this.indForm;
    const link = this.parseCarLink(f.vehicle);

    if (!link) {
      if (form === 'company') {
        this.bizForm.amount = '';
        this.bizForm.period = '';
      } else {
        this.indForm.amount = '';
        this.indForm.period = '';
      }
      this.cdr.detectChanges();
      return;
    }

    this.api.getCarById(link.id).subscribe({
      next: raw => {
        if (!raw) return;

        const price = this.parsePriceToNumber(raw.price);
        const fin = raw.finance;
        const eligible = !!(fin?.enabled && fin?.active);

        this.applyFinanceCache.set(link.id, eligible);

        if (!eligible || price <= 0) {
          if (form === 'company') {
            this.bizForm.amount = '';
            this.bizForm.period = '';
          } else {
            this.indForm.amount = '';
            this.indForm.period = '';
          }
          this.cdr.detectChanges();
          return;
        }

        const depositPct = Math.max(20, fin?.deposit ?? 20);
        const rate = Math.max(0, fin?.rate ?? 0);
        const carTerm = fin?.term ?? 48;

        const opts = [12, 24, 36, 48, 60];
        const months = opts.reduce(
          (a, b) => Math.abs(b - carTerm) < Math.abs(a - carTerm) ? b : a,
          opts[0]
        );

        const deposit = price * (depositPct / 100);
        const loan = price - deposit;
        const amount = Math.max(0, Math.round(loan)).toLocaleString('en-KE');
        const period = months === 60 ? '60 months (new vehicles)' : `${months} months`;

        if (form === 'company') {
          this.bizForm.amount = amount;
          this.bizForm.period = period;
        } else {
          this.indForm.amount = amount;
          this.indForm.period = period;
        }

        this.cdr.detectChanges();
      },
      error: () => { }
    });
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
    const hideNumbers = this.applyType === 'company' ? this.bizHideNumbers : this.indHideNumbers;

    let lines: string[];
    if (this.applyType === 'company') {
      const f = this.bizForm;
      lines = [
        `Hello A Plus Motors, I'd like to ${hideNumbers ? 'enquire about financing for' : 'apply for business vehicle financing on'} this car.`,
        `Company: ${f.company.trim()}`,
        `Contact: ${f.contact.trim()}`,
        `Phone: ${f.phone.trim()}`,
        `Email: ${f.email.trim()}`,
        f.pin.trim() ? `KRA PIN: ${f.pin.trim()}` : '',
        ...this.vehicleLines(f.vehicle),
        !hideNumbers && f.amount.trim() ? `Loan amount: Ksh ${f.amount.trim()}` : '',
        !hideNumbers && f.period ? `Repayment period: ${f.period}` : '',
        ...this.figuresLines()
      ];
    } else {
      const f = this.indForm;
      lines = [
        `Hello A Plus Motors, I'd like to ${hideNumbers ? 'enquire about financing for' : 'apply for vehicle financing on'} this car.`,
        `Name: ${f.name.trim()}`,
        `Phone: ${f.phone.trim()}`,
        `Email: ${f.email.trim()}`,
        f.idNumber.trim() ? `National ID: ${f.idNumber.trim()}` : '',
        f.employment ? `Employment: ${f.employment}` : '',
        ...this.vehicleLines(f.vehicle),
        !hideNumbers && f.amount.trim() ? `Loan amount: Ksh ${f.amount.trim()}` : '',
        !hideNumbers && f.period ? `Repayment period: ${f.period}` : '',
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

    // Now that the application is locked in, clear the calculator so returning
    // to it shows fresh defaults.
    this.resetCalculator();

    this.cdr.detectChanges();
    document.querySelector('.fn-done')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  private resetForms(): void {
    this.indForm = {
      name: '', phone: '', email: '', idNumber: '',
      employment: '', vehicle: '', amount: '', period: '',
    };
    this.bizForm = {
      company: '', contact: '', phone: '', email: '',
      pin: '', vehicle: '', amount: '', period: '',
    };
    this.figures = null;
    this.attempted = false;
    this.submitted = false;
  }

  // ---------- Insurance ----------
  coverTypes: CoverType[] = [
    { icon: 'verified_user', title: 'Comprehensive', text: 'Covers your vehicle against accident damage, theft and fire, plus liability to others. The usual choice for a financed car.' },
    { icon: 'groups', title: 'Third party only', text: 'The minimum legal cover. Pays for injury or damage you cause to other people and their property.' },
    { icon: 'local_fire_department', title: 'Third party, fire & theft', text: 'Third-party cover with added protection if your vehicle is stolen or damaged by fire.' }
  ];

  insurers: Insurer[] = [
    { name: 'Jubilee Insurance', short: 'JI', domain: 'jubileeinsurance.com', wide: false },
    { name: 'CIC Insurance', short: 'CIC', domain: 'cic.co.ke', wide: false },
    { name: 'Britam', short: 'BR', domain: 'britam.com', wide: false },
    { name: 'APA Insurance', short: 'APA', domain: 'apainsurance.org', wide: true },
    { name: 'Madison Insurance', short: 'MI', domain: 'madison.co.ke', wide: false },
    { name: 'UAP Old Mutual', short: 'UOM', domain: 'oldmutual.com', wide: false }
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
  goHome(): void {
    if (this.submitted) {
      this.resetForms();
      this.resetCalculator();
    }
    this.router.navigate(['']);
  }

  goToStore(): void {
    if (this.submitted) {
      this.resetForms();
      this.resetCalculator();
    }
    this.router.navigate(['/store']);
  }

  goToImport(): void {
    if (this.submitted) {
      this.resetForms();
      this.resetCalculator();
    }
    this.router.navigate(['/imported-trade-in'], { queryParams: { tab: 'import' } });
  }

  goToTradeIn(): void {
    if (this.submitted) {
      this.resetForms();
      this.resetCalculator();
    }
    this.router.navigate(['/imported-trade-in'], { queryParams: { tab: 'trade-in' } });
  }
}