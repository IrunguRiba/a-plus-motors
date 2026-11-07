import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostListener, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';

type PrivacyView = 'data' | 'complaint';

interface PrivacyPage {
  id: string;
  tab: string;
  title: string;
  summary: string;
  points: string[];
  steps: string[];
}

@Component({
  selector: 'app-privacy',
  imports: [CommonModule, FormsModule],
  templateUrl: './privacy.html',
  styleUrl: './privacy.css',
})
export class PrivacyPolicy implements AfterViewInit, OnDestroy {
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  private location = inject(Location);

  logoImg = 'fav3.png';

  view: PrivacyView = 'data';
  activeIndex = 0;
  clientName = '';
  userEmail = '';
  vehicleDetails = '';
  complaintCategory = '';
  complaintMessage = '';
  attempted = false;
  submitted = false;
  whatsappNumber = '254707555666';

  @ViewChild('contentArea', { static: false }) contentArea!: ElementRef<HTMLElement>;
  @ViewChild('scroller', { static: false }) scroller!: ElementRef<HTMLElement>;

  categories = [
    { value: 'data-privacy', label: 'Data protection & privacy breach' },
    { value: 'logbook-transfer', label: 'NTSA / logbook transfer delay' },
    { value: 'financing', label: 'Asset financing / bank dispute' },
    { value: 'showroom-service', label: 'Showroom service or sales issue' },
    { value: 'other', label: 'Other legal / compliance matter' }
  ];

  pages: PrivacyPage[] = [
    {
      id: 'data-protection',
      tab: 'Data',
      title: 'Data Protection',
      summary: 'We protect your personal information under Article 31 of the Constitution of Kenya and the Data Protection Act. Details from inquiries, test drives and purchases are used only for lawful business purposes.',
      points: [
        'Covers name, contacts, ID / passport copy and KRA PIN.',
        'Physical, technical and administrative safeguards guard against loss or misuse.'
      ],
      steps: [
        'Write to our Data Protection Officer; we respond within 72 hours.',
        'Still unresolved? Lodge a complaint with the Office of the Data Protection Commissioner (ODPC).'
      ]
    },
    {
      id: 'cookie-policy',
      tab: 'Cookies',
      title: 'Cookies & Tracking',
      summary: 'Our website uses cookies to analyse traffic, remember your preferences and personalise vehicle listings.',
      points: [
        'You can disable cookies any time in your browser settings.',
        'Turning off essential cookies may limit some interactive features.'
      ],
      steps: [
        'Clear your cookies and report tracking concerns to our IT & Compliance desk.',
        'Block non-essential trackers, or report persistent issues to consumer protection authorities.'
      ]
    },
    {
      id: 'information-collection',
      tab: 'Collection',
      title: 'Information Collection',
      summary: 'We collect information directly from you to keep vehicle transactions smooth and verifiable.',
      points: [
        'Collected through reservations, financing requests, import registrations and support chats.',
        'Used to verify identity, process logbook transfers, handle clearing and registration, and send after-sale reminders.'
      ],
      steps: [
        'Request rectification if data was taken without consent or is inaccurate.',
        'Send a written correction request; we update or purge records within 7 business days.'
      ]
    },
    {
      id: 'financing-privacy',
      tab: 'Financing',
      title: 'Financing & Third Parties',
      summary: 'Loan and asset-finance applications require sharing certain records with partner banks for credit appraisal.',
      points: [
        'Data goes only to trusted financiers, insurers and regulators such as NTSA, under confidentiality agreements.',
        'We never sell, rent or trade your data to marketing agencies.'
      ],
      steps: [
        'Ask our finance department for an audit trail if data is shared beyond your application.',
        'If disclosure is confirmed, seek compensation or report to the CBK consumer protection division and the ODPC.'
      ]
    },
    {
      id: 'user-rights',
      tab: 'Your rights',
      title: 'Your Rights & Contact',
      summary: 'You keep full legal rights over your personal data held by A-Plus Motors Limited.',
      points: [
        'Right to access, correct or erase your data ("right to be forgotten").',
        'Send requests or concerns to our compliance department via the main office or official channels.'
      ],
      steps: [
        'If a request is ignored, delayed or unlawfully denied, you may escalate it.',
        'File a petition under the Data Protection Act or seek redress at the High Court of Kenya.'
      ]
    }
  ];

  // ---------- Validation ----------
  get nameValid(): boolean { return this.clientName.trim().length >= 2; }
  get emailValid(): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.userEmail.trim()); }
  get categoryValid(): boolean { return !!this.complaintCategory; }
  get messageValid(): boolean { return this.complaintMessage.trim().length >= 5; }
  get formValid(): boolean { return this.nameValid && this.emailValid && this.categoryValid && this.messageValid; }

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

  // ---------- Views ----------
  setView(v: PrivacyView): void {
    if (v === this.view) return;
    if (v === 'complaint' && this.submitted) this.resetForm();   // fresh form after a sent complaint
    this.view = v;
    this.cdr.detectChanges();
    this.scroller?.nativeElement.scrollTo({ top: 0 });
  }

  setActivePage(index: number): void {
    if (this.activeIndex === index) return;
    const body = this.contentArea.nativeElement.querySelector('.pv-body');
    if (!body) { this.activeIndex = index; return; }
    gsap.to(body, {
      opacity: 0, y: 10, duration: 0.2,
      onComplete: () => {
        this.activeIndex = index;
        this.cdr.detectChanges();
        gsap.fromTo(body, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' });
      }
    });
  }

  // ---------- Form ----------
  submitComplaint(): void {
    this.attempted = true;
    if (!this.formValid) return;
    this.submitted = true;
    this.cdr.detectChanges();
    this.scroller?.nativeElement.scrollTo({ top: 0 });
  }

  get categoryLabel(): string {
    return this.categories.find(c => c.value === this.complaintCategory)?.label ?? '';
  }

  get waLink(): string {
    const lines = [
      `Hello A Plus Motors, I'd like to lodge a complaint / inquiry.`,
      `Name: ${this.clientName.trim()}`,
      `Email: ${this.userEmail.trim()}`,
      `Category: ${this.categoryLabel}`
    ];
    if (this.vehicleDetails.trim()) lines.push(`Vehicle: ${this.vehicleDetails.trim()}`);
    lines.push(`Details: ${this.complaintMessage.trim()}`);
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  resetForm(): void {
    this.clientName = '';
    this.userEmail = '';
    this.vehicleDetails = '';
    this.complaintCategory = '';
    this.complaintMessage = '';
    this.attempted = false;
    this.submitted = false;
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