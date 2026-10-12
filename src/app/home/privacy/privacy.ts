import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';

@Component({
  selector: 'app-privacy',
  imports: [CommonModule, FormsModule],
  templateUrl: './privacy.html',
  styleUrl: './privacy.css',
})
export class PrivacyPolicy implements AfterViewInit, OnDestroy {
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  activeIndex: number = 0;
  clientName: string = '';
  userEmail: string = '';
  vehicleDetails: string = '';
  complaintCategory: string = '';
  complaintMessage: string = '';
  successMessage: string = '';
  
  @ViewChild('contentArea', { static: false }) contentArea!: ElementRef;


  pages = [
    {
      id: 'data-protection',
      navText: 'I. Data Protection',
      title: 'I. Data Protection Policy',
      content: `DEAR ESTEEM CUSTOMER,

      At A-Plus Motors Limited, we value your privacy and are fully committed to safeguarding your personal information.

      • Constitutional & Legal Foundation: Guided by the fundamental right to privacy under Article 31 of the Constitution of Kenya and the Data Protection Act, any information collected during vehicle inquiries, test drives, or purchases (such as your name, contact details, ID/passport copy, and KRA PIN) is strictly processed for lawful business purposes.
      • Security Protocols: We implement robust physical, technical, and administrative security measures to protect your records against unauthorized access, alteration, disclosure, or loss.

      WHAT TO DO IF YOUR DATA IS VIOLATED:
      (i) Notify our Data Protection Officer (DPO) immediately in writing via email or through our official main office. We are legally mandated to investigate and respond within 72 hours.
      (ii) If you are unsatisfied with our resolution, you have the statutory right to lodge a formal complaint directly with the Office of the Data Protection Commissioner (ODPC).`
    },
    {
      id: 'cookie-policy',
      navText: 'II. Cookie Policy',
      title: 'II. Cookie & Tracking Policy',
      content: `Our website uses cookies and tracking technologies to enhance your browsing experience as you explore our inventory of new and second-hand vehicles.

      • Purpose of Cookies: Cookies help us analyze site traffic, remember your user preferences, and personalize vehicle listings in alignment with consumer protection standards.
      • Your Control: You retain full control over your tracking preferences and can disable cookies at any time via your individual browser settings. Note that disabling essential cookies may impact certain interactive site features.

      WHAT TO DO IF VIOLATED:
      (i) Clear your browser cookies immediately and report any tracking anomalies or security concerns to our IT and Compliance desk.
      (ii) Block all non-essential site trackers via your browser controls or report persistent infractions to consumer protection authorities.`
    },
    {
      id: 'information-collection',
      navText: 'III. Information Collection',
      title: 'III. Collection of Information',
      content: `We collect information directly from you when you interact with A-Plus Motors Limited to ensure smooth vehicle transactions.

      • When We Collect: Information is gathered when you fill out vehicle reservation forms, request asset financing support, register imported cars, or communicate with our customer support teams.
      • Purpose of Collection: This data enables us to verify identities, process logbook transfers, coordinate clearing and registration documents seamlessly, and provide reliable after-sale maintenance reminders.

      WHAT TO DO IF VIOLATED:
      (i) If you discover we have collected information without your explicit consent or recorded inaccurate details, request immediate rectification.
      (ii) Submit a written correction request to our customer management team specifying the errors, and we will update or purge your records within 7 business days.`
    },
    {
      id: 'financing-privacy',
      navText: 'IV. Financing & Third Parties',
      title: 'IV. Asset Financing & Third Parties',
      content: `When applying for vehicle loans or asset financing through our partner banking institutions, certain personal and financial records must be shared to facilitate credit appraisal.

      • Trusted Partnerships: We only share necessary data with trusted financial partners, insurance providers, and regulatory authorities (such as the National Transport and Safety Authority - NTSA) under strict confidentiality agreements.
      • Zero Resale Policy: We strictly never sell, rent, or trade your personal data to third-party marketing agencies.

      WHAT TO DO IF VIOLATED:
      (i) If your financial data or credit profile is shared outside the scope of your loan application, request an immediate audit trail of your data from our finance department.
      (ii) If unauthorized disclosure is confirmed, you may seek statutory compensation or report the breach to the Central Bank of Kenya (CBK) financial consumer protection division and the ODPC.`
    },
    {
      id: 'user-rights',
      navText: 'V. Your Rights & Contact',
      title: 'V. Your Rights & Contact Information',
      content: `You retain full constitutional and legal rights regarding the handling of your personal information by A-Plus Motors Limited.

      • Your Core Rights: You have the right to request access to, correction of, or complete erasure ("right to be forgotten") of any personal data we hold about you.
      • Contact Compliance: For any inquiries, concerns, or formal requests regarding our privacy practices, reach out directly to our compliance department through our main office or official channels.

      WHAT TO DO IF VIOLATED:
      (i) If your formal data requests are ignored, delayed beyond statutory timeframes, or unlawfully denied, you have the absolute right to escalate the matter.
      (ii) You can file a legal petition citing a breach of statutory data subject rights under the Data Protection Act or seek redress and compensation through the High Court of Kenya for infringement of your constitutional right to privacy.`
    }
  ];

  ngAfterViewInit(): void {
    this.animateContentIn();
  }

  setActivePage(index: number) {
    if (this.activeIndex === index) return;
    
    this.resetForm();

    // Animate out current content
    gsap.to(this.contentArea.nativeElement, {
      opacity: 0,
      y: 15,
      duration: 0.25,
      onComplete: () => {
        this.activeIndex = index;
        this.cdr.detectChanges();
        this.animateContentIn();
      }
    });
  }

  animateContentIn() {
    if (!this.contentArea) return;
    gsap.fromTo(
      this.contentArea.nativeElement,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }

  submitComplaint() {
    if (!this.clientName.trim() || !this.userEmail.trim() || !this.complaintCategory || !this.complaintMessage.trim()) {
      alert('Please fill out all required fields and select a complaint category before proceeding.');
      return;
    }
    this.successMessage = '✓ Complaint sent successfully. Our Customer service will be in touch shortly...';
    
    setTimeout(() => {
      this.successMessage = '';
      this.resetForm();
    }, 5000);
  }

  resetForm() {
    this.clientName = '';
    this.userEmail = '';
    this.vehicleDetails = '';
    this.complaintCategory = '';
    this.complaintMessage = '';
  }

  goHome(): void { this.router.navigate(['']); }
  goToStore() { this.router.navigate(['/store']); }
  goToFinance() { this.router.navigate(['/financing']); }
  goToBlogs() { this.router.navigate(['/blogs']); }

  ngOnDestroy(): void {}
}