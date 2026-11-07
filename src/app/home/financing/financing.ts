import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';

type FinancingTab = 'general' | 'individual' | 'company';

@Component({
  selector: 'app-financing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financing.html',
  styleUrl: './financing.css',
})
export class Financing implements AfterViewInit, OnDestroy {
  constructor(private router: Router) {}

  private location = inject(Location);

  private cdr = inject(ChangeDetectorRef);

  logoImg = 'fav3.png';
  phoneImg = 'call.png';
  whatsappImg = 'whatsapp.png';
  youtubeImg = 'youtube.png';
  phoneTel = '+254707555666';
  whatsappNumber = '254707555666';

  // ---------- Application forms ----------
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
    return this.activeTab === 'company'
      ? this.bizCompanyOk && this.bizContactOk && this.bizPhoneOk && this.bizEmailOk && this.bizVehicleOk && this.bizPeriodOk
      : this.indNameOk && this.indPhoneOk && this.indEmailOk && this.indVehicleOk && this.indPeriodOk;
  }

  get applicantName(): string {
    return this.activeTab === 'company' ? this.bizForm.contact.trim() : this.indForm.name.trim();
  }

  get waLink(): string {
    let lines: string[];
    if (this.activeTab === 'company') {
      const f = this.bizForm;
      lines = [
        `Hello A Plus Motors, I'd like to apply for business vehicle financing.`,
        `Company: ${f.company.trim()}`,
        `Contact: ${f.contact.trim()}`,
        `Phone: ${f.phone.trim()}`,
        `Email: ${f.email.trim()}`,
        f.pin.trim() ? `KRA PIN: ${f.pin.trim()}` : '',
        `Vehicle: ${f.vehicle.trim()}`,
        f.amount.trim() ? `Loan amount: Ksh ${f.amount.trim()}` : '',
        `Repayment period: ${f.period}`
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
        `Vehicle: ${f.vehicle.trim()}`,
        f.amount.trim() ? `Loan amount: Ksh ${f.amount.trim()}` : '',
        `Repayment period: ${f.period}`
      ];
    }
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`;
  }

  submitApplication(): void {
    this.attempted = true;
    if (!this.formValid) return;
    this.submitted = true;
    this.cdr.detectChanges();
    this.scroller?.nativeElement.querySelector('.fn-done')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  private resetForms(): void {
    this.indForm = { name: '', phone: '', email: '', idNumber: '', employment: '', vehicle: '', amount: '', period: '' };
    this.bizForm = { company: '', contact: '', phone: '', email: '', pin: '', vehicle: '', amount: '', period: '' };
    this.attempted = false;
    this.submitted = false;
  }

  @ViewChild('contentArea', { static: false }) contentArea!: ElementRef<HTMLElement>;
  @ViewChild('scroller', { static: false }) scroller!: ElementRef<HTMLElement>;

  activeTab: FinancingTab = 'general';

  tabs: { id: FinancingTab; label: string }[] = [
    { id: 'general', label: 'How we finance' },
    { id: 'individual', label: 'Individual' },
    { id: 'company', label: 'Business' }
  ];

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

  // ---------- Lifecycle ----------
  ngAfterViewInit(): void {
    document.body.style.overflow = 'hidden';
    gsap.fromTo(this.contentArea.nativeElement,
      { opacity: 0, y: 18, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    gsap.killTweensOf(this.contentArea?.nativeElement);
  }

  // ---------- Tabs ----------
  setActiveTab(tab: FinancingTab): void {
    if (tab === this.activeTab) return;
    if (this.submitted) this.resetForms();   // fresh form after a sent application
    this.attempted = false;
    this.activeTab = tab;
    this.scroller?.nativeElement.scrollTo({ top: 0 });
  }

  // ---------- Close ----------
  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }

  close(): void {
    gsap.to(this.contentArea.nativeElement, {
      opacity: 0, y: 14, scale: 0.98, duration: 0.3, ease: 'power2.inOut',
      onComplete: () => {
        if (window.history.length > 1) this.location.back();
        else this.router.navigate(['']);
      }
    });
  }
}