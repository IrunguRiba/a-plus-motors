import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Review {
  rating: number;
  quote: string;
  body: string;
  author: string;
  purchase: string;
  date: string;
}

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  currentYear = new Date().getFullYear();
  copyright = 'copyright.png';
  legal = 'insurance.png';

  starScale = [1, 2, 3, 4, 5];

  reviews: Review[] = [
    {
      rating: 5,
      quote: 'Absolute five-star experience from start to finish.',
      body: 'The paperwork was handled efficiently, and I drove off the lot in my new vehicle the same afternoon with a full tank of gas. Highly recommend them if you want a transparent, stress-free dealership experience!',
      author: 'David K.',
      purchase: '2026 Toyota RAV4',
      date: '2 weeks ago',
    },
    {
      rating: 5,
      quote: 'Honest prices and no hidden surprises.',
      body: 'Every figure was explained before I signed. The team walked me through the options patiently and the car was exactly as described. I will be back for my next purchase.',
      author: 'Grace W.',
      purchase: '2026 Mazda CX-5',
      date: '1 month ago',
    },
    {
      rating: 5,
      quote: 'Financing made simple.',
      body: 'I was nervous about the loan process, but they handled the bank side quickly and kept me updated at every step. Approval came through in days, not weeks.',
      author: 'Peter M.',
      purchase: '2025 Subaru Forester',
      date: '1 month ago',
    },
    {
      rating: 4,
      quote: 'Great selection and a smooth trade-in.',
      body: 'They valued my old car fairly and the swap was done in one visit. Delivery took a day longer than promised, but the communication was excellent throughout.',
      author: 'Amina S.',
      purchase: '2024 Honda Vezel',
      date: '2 months ago',
    },
    {
      rating: 5,
      quote: 'Imported exactly the car I asked for.',
      body: 'From auction selection to clearing at the port, they kept me informed and the landed cost matched the quote. The car arrived in perfect condition.',
      author: 'Brian O.',
      purchase: '2023 Toyota Harrier',
      date: '2 months ago',
    },
    {
      rating: 5,
      quote: 'Professional team that actually listens.',
      body: 'I knew my budget and what I needed for the family. They did not push me toward anything more expensive and found a perfect fit within a week.',
      author: 'Faith N.',
      purchase: '2025 Nissan X-Trail',
      date: '3 months ago',
    },
    {
      rating: 5,
      quote: 'After-sales support you can rely on.',
      body: 'I had a small question a week after purchase and they responded within the hour. It is rare to find a dealership that cares after the sale.',
      author: 'Samuel T.',
      purchase: '2026 Toyota Fortuner',
      date: '3 months ago',
    },
    {
      rating: 5,
      quote: 'Clean cars, clean process.',
      body: 'The inspection report was detailed and the vehicle was spotless. Transfer of ownership was handled for me, which saved a lot of time.',
      author: 'Lucy A.',
      purchase: '2025 Mazda CX-30',
      date: '4 months ago',
    },
  ];

  marqueeReviews: Review[] = [...this.reviews, ...this.reviews];

  constructor(private router: Router) {}

  goToPrivacy(event?: Event): void {
    event?.preventDefault();
    this.router.navigate([{ outlets: { privacy: ['privacy'] } }]);
  }

  goToFinancing(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['financing']);
  }

  goToContact(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['contact']);
  }

  goToSubsidiaries(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['about-us']);
  }
}