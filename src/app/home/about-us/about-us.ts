import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Nav2 } from '../nav-2/nav-2';


@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, Nav2],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs implements AfterViewInit, OnDestroy {
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  activeIndex: number = 0;
  
  @ViewChild('contentArea', { static: false }) contentArea!: ElementRef;
  @ViewChild('marqueeTrack', { static: false }) marqueeTrack!: ElementRef;

  private marqueeTween: gsap.core.Tween | null = null;

  // Data arrays...
  pages = [
    {
      id: 'trusted-experience',
      navText: 'I. Trusted Experience',
      title: 'I. Trusted Experience',
      content: "We humbly started early in 2005 as A-Plus Commercial Agency and later incorporated as A-Plus Motors Limited in mid 2006. Under the stewardship of Mr. James Mwangi Muturi. We have in excess of four hundred and fifty clean new and second hand vehicles for sale. We are proud to have the country's best and most talented staff who are motivated by customer satisfaction.",
      reviews: [
        { quote: '"Absolute five-star experience from start to finish."', body: 'The paperwork was handled efficiently, and I drove off the lot in my new vehicle the same afternoon with a full tank of gas.', author: '— David K.', purchase: 'Purchased: 2026 Toyota RAV4', date: 'Reviewed 2 weeks ago' },
        { quote: '"Outstanding selection and service!"', body: 'Found exactly what I needed after visiting several places. Incredible inventory of clean vehicles.', author: '— Amina R.', purchase: 'Purchased: 2024 Subaru Forester', date: 'Reviewed 1 month ago' },
        { quote: '"Honest staff and transparent pricing."', body: 'No hidden fees or unexpected surprises. The team went above and beyond to make me feel comfortable.', author: '— Brian M.', purchase: 'Purchased: 2025 Mazda CX-5', date: 'Reviewed 3 weeks ago' },
        { quote: '"Professional team from day one."', body: 'Mr. James and his crew know what they are doing. Smooth process throughout.', author: '— Grace W.', purchase: 'Purchased: 2023 Toyota Vanguard', date: 'Reviewed 2 months ago' },
        { quote: '"Best dealership in the region."', body: 'Unmatched customer service and prompt delivery. Will definitely return for my next vehicle.', author: '— John O.', purchase: 'Purchased: 2024 Toyota Hilux', date: 'Reviewed a month ago' }
      ]
    },
    {
      id: 'full-package',
      navText: 'II. Full Package Service',
      title: 'II. Full Package Service',
      content: 'We offer end-to-end solutions including importing, clearing, registration, and custom branding for corporate fleets. Our comprehensive service ensures you drive off the lot with everything you need.',
      reviews: [
        { quote: '"Seamless import and registration process!"', body: 'They handled everything from customs clearance to corporate branding seamlessly. Great communication.', author: '— Sarah M.', purchase: 'Purchased: Fleet Delivery', date: 'Reviewed 3 weeks ago' },
        { quote: '"Took care of all the paperwork effortlessly."', body: 'I hate dealing with registration and clearing bureaucracy, but they took care of everything.', author: '— Kevin N.', purchase: 'Purchased: Nissan X-Trail', date: 'Reviewed 2 weeks ago' },
        { quote: '"Custom branding looked amazing."', body: 'Branded our entire company fleet precisely according to our specifications right before handover.', author: '— Linda K.', purchase: 'Purchased: Fleet Sourcing', date: 'Reviewed 1 month ago' },
        { quote: '"End-to-end efficiency at its best."', body: 'From port to plate numbers, they managed the entire pipeline without a single hitch.', author: '— Peter J.', purchase: 'Purchased: Toyota Land Cruiser', date: 'Reviewed 2 months ago' },
        { quote: '"Zero stress logistics."', body: 'Clear updates at every single checkpoint of the importation lifecycle.', author: '— Cynthia A.', purchase: 'Purchased: Mitsubishi Pajero', date: 'Reviewed 3 weeks ago' }
      ]
    },
    {
      id: 'after-sale',
      navText: 'III. After Sale Service',
      title: 'III. After Sale Service',
      content: 'Our relationship does not end when you drive off the lot. We offer comprehensive after-sale support including maintenance scheduling, genuine spare parts, and warranty claims to ensure your vehicle stays in top condition.',
      reviews: [
        { quote: '"Incredible ongoing support after purchase."', body: 'Had a minor service check scheduled and they were extremely professional, punctual, and transparent.', author: '— Kevin O.', purchase: 'Purchased: Maintenance Client', date: 'Reviewed 1 month ago' },
        { quote: '"Genuine spare parts availability."', body: 'It is hard to find a dealer that stays committed after you drive away, but these guys are exceptional.', author: '— Rachel T.', purchase: 'Purchased: 2022 Toyota Harrier', date: 'Reviewed 3 weeks ago' },
        { quote: '"Warranty claim handled swiftly."', body: 'Experienced a small snag and the workshop team sorted it out under warranty with zero pushback.', author: '— Daniel M.', purchase: 'Purchased: Subaru Outback', date: 'Reviewed 2 weeks ago' },
        { quote: '"Dedicated maintenance scheduling."', body: 'They track your mileage and send reminders for routine tune-ups. Top-tier service culture.', author: '— Faith N.', purchase: 'Purchased: Toyota Crown', date: 'Reviewed a month ago' },
        { quote: '"Peace of mind guaranteed."', body: 'Knowing they have a dedicated workshop for post-purchase care gives me ultimate confidence.', author: '— Eric S.', purchase: 'Purchased: Mazda Demio', date: 'Reviewed 2 months ago' }
      ]
    },
    {
      id: 'reviews',
      navText: 'IV. Client Reviews',
      title: 'IV. Client Reviews',
      content: 'Read what our satisfied clients across the country have to say about their experience purchasing their vehicles from A-Plus Motors. We take pride in our reputation and customer satisfaction.',
      reviews: [
        { quote: '"Absolute five-star experience from start to finish."', body: 'The paperwork was handled efficiently, and I drove off the lot in my new vehicle the same afternoon.', author: '— David K.', purchase: 'Purchased: 2026 Toyota RAV4', date: 'Reviewed 2 weeks ago' },
        { quote: '"An absolute joy buying from them."', body: 'Friendly consultants, clean vehicles, and an overall brilliant showroom ambiance.', author: '— Susan B.', purchase: 'Purchased: 2025 Lexus RX350', date: 'Reviewed 1 week ago' },
        { quote: '"Exceeded all expectations."', body: 'The car looked even better in person than in the photos. Pristine condition.', author: '— Mark L.', purchase: 'Purchased: 2023 Mercedes Benz C200', date: 'Reviewed 3 weeks ago' },
        { quote: '"Trustworthy team."', body: 'Sent money from abroad and they delivered the vehicle right to my doorstep upcountry clean.', author: '— George K.', purchase: 'Purchased: 2024 Toyota Fortuner', date: 'Reviewed a month ago' },
        { quote: '"Highly recommended to everyone."', body: 'If you want zero headaches buying a car in this country, come straight to A-Plus Motors.', author: '— Carol M.', purchase: 'Purchased: 2024 VW Tiguan', date: 'Reviewed 2 months ago' }
      ]
    },
    {
      id: 'faq',
      navText: 'V. FAQs',
      title: 'V. FAQs',
      content: 'Here you will find answers to the most common questions our clients ask regarding vehicle sourcing, financing options, and delivery timelines. If you have a specific question, feel free to contact us.',
      reviews: [
        { quote: '"Cleared up all my financing questions."', body: 'The team made understanding vehicle sourcing and financing options completely clear before I committed.', author: '— Brenda W.', purchase: 'Purchased: 2025 Subaru Forester', date: 'Reviewed 2 months ago' },
        { quote: '"Very helpful explanation on timelines."', body: 'They broke down the exact timeline for shipping and customs which helped me plan my budget.', author: '— Tom H.', purchase: 'Purchased: Import Client', date: 'Reviewed 1 month ago' },
        { quote: '"Transparent terms and conditions."', body: 'Every single question regarding bank financing partnerships was answered thoroughly.', author: '— Nancy P.', purchase: 'Purchased: Asset Finance Client', date: 'Reviewed 3 weeks ago' },
        { quote: '"Patient with all my inquiries."', body: 'I asked dozens of questions about logbook transfers and they patiently walked me through.', author: '— Victor E.', purchase: 'Purchased: 2023 Toyota Auris', date: 'Reviewed 2 weeks ago' },
        { quote: '"Extremely comprehensive support."', body: 'The FAQs and live assistance clarified everything about trade-ins and valuation policies.', author: '— Juliet W.', purchase: 'Purchased: Trade-in Client', date: 'Reviewed a month ago' }
      ]
    }
  ];

  ngAfterViewInit(): void {
    this.animateContentIn();
    this.initGsapMarquee();
  }

  setActivePage(index: number) {
    if (this.activeIndex === index) return;
    
    // Animate out current content
    gsap.to(this.contentArea.nativeElement, {
      opacity: 0,
      y: 15,
      duration: 0.25,
      onComplete: () => {
        this.activeIndex = index;
        this.cdr.detectChanges();
        this.animateContentIn();
        this.initGsapMarquee();
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

  initGsapMarquee() {
    if (!this.marqueeTrack) return;
    
    // Kill existing tween if any
    if (this.marqueeTween) {
      this.marqueeTween.kill();
    }

    // GSAP infinite smooth marquee loop replacing CSS animation
    const track = this.marqueeTrack.nativeElement;
    const totalWidth = track.scrollWidth / 2;

    this.marqueeTween = gsap.to(track, {
      x: `-=${totalWidth}`,
      duration: 26,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize(x => parseFloat(x) % totalWidth)
      }
    });
  }

  pauseMarquee() {
    if (this.marqueeTween) this.marqueeTween.timeScale(0.2); 
  }

  resumeMarquee() {
    if (this.marqueeTween) this.marqueeTween.timeScale(1);
  }

  goHome(): void { this.router.navigate(['']); }
  goToStore() { this.router.navigate(['/store']); }
  goToFinance() { this.router.navigate(['/financing']); }
  goToBlogs() { this.router.navigate(['/blogs']); }

  ngOnDestroy(): void {
    if (this.marqueeTween) {
      this.marqueeTween.kill();
    }
  }
}