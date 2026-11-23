import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Nav } from '../nav/nav';
import { Footer } from '../footer/footer';
import { SafeVideoUrlPipe } from '../portfolio/specs/safe-url.pipe';
import { ApiServices } from '../../services/api-services';
import {
  ReviewVideo,
  resolveReviewVideo,
  primeMutedVideo,
  markReady,
  prefersReducedMotion,
} from '../portfolio/specs/review-video';

interface HeadSlide {
  id: number;
  video: ReviewVideo;
}

interface Section {
  id: string;
  title: string;
  paragraphs: string[];
}

interface Faq {
  q: string;
  a: string;
}

@Component({
  selector: 'app-about-us',
  imports: [Nav, Footer, SafeVideoUrlPipe],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs implements OnInit, OnDestroy {
  private static readonly EMBED_MS = 25000;

  private router = inject(Router);
  private api = inject(ApiServices);

  logoImg = 'fav3.png';
  isMenuOpen = false;
  searchWindowOpened = false;

  /* Hero video: same pool/queue logic as the contact page */
  videoPool: ReviewVideo[] = [];
  videoSlides: HeadSlide[] = [];

  private videoQueue: ReviewVideo[] = [];
  private videoSeq = 0;
  private videoTimer: ReturnType<typeof setTimeout> | null = null;
  private videoSub?: Subscription;

  openFaq: number | null = 0;

  readonly sections: Section[] = [
    {
      id: 'trusted-experience',
      title: 'Trusted Experience',
      paragraphs: [
        'We humbly started early in 2005 as A-Plus Commercial Agency and later incorporated as A-Plus Motors Limited in mid 2006. Under the stewardship of Mr. James Mwangi Muturi. We have in excess of four hundred and fifty clean new and second hand vehicles for sale. We are proud to have the country\u2019s best and most talented staff who are motivated by customer satisfaction.',
      ],
    },
    {
      id: 'full-package',
      title: 'Full Package Service',
      paragraphs: [
        'We offer end-to-end solutions including importing, clearing, registration, and custom branding for corporate fleets. Our comprehensive service ensures you drive off the lot with everything you need.',
      ],
    },
    {
      id: 'after-sale',
      title: 'After Sale Service',
      paragraphs: [
        'Our relationship does not end when you drive off the lot. We offer comprehensive after-sale support including maintenance scheduling, genuine spare parts, and warranty claims to ensure your vehicle stays in top condition.',
      ],
    },
  ];

  readonly faqs: Faq[] = [
    {
      q: 'Where are you located and when are you open?',
      a: 'We are based in Nairobi, Kenya, and open Monday to Saturday, 8am to 6pm.',
    },
    {
      q: 'Do you sell both new and second hand vehicles?',
      a: 'Yes. We have in excess of four hundred and fifty clean new and second hand vehicles for sale.',
    },
    {
      q: 'Can I finance a vehicle?',
      a: 'Yes. Our financing page lets you compare loan options and estimate your monthly payments before you commit.',
    },
    {
      q: 'Can you import a car for me?',
      a: 'Yes. We offer end-to-end solutions including importing, clearing and registration.',
    },
    {
      q: 'Do you accept trade-ins?',
      a: 'Yes. You can trade in your current car for a valuation. See the Trade-in page for details.',
    },
    {
      q: 'Do you offer after-sale support?',
      a: 'Yes. We offer maintenance scheduling, genuine spare parts and warranty claims.',
    },
    {
      q: 'Can you brand vehicles for my company fleet?',
      a: 'Yes. Custom branding for corporate fleets is part of our full package service.',
    },
    {
      q: 'How do I get in touch?',
      a: 'Use the Contact page, call or WhatsApp us, or send an email.',
    },
  ];

  ngOnInit(): void {
    if (prefersReducedMotion()) return;

    this.videoSub = this.api.getWebCars().subscribe({
      next: (cars) => {
        const seen = new Set<string>();
        const pool: ReviewVideo[] = [];
        for (const c of cars ?? []) {
          const v = resolveReviewVideo(c.reviewVideoUrl);
          if (!v || seen.has(v.src)) continue;
          seen.add(v.src);
          pool.push(v);
        }
        this.videoPool = pool;
        this.videoQueue = [];
        this.nextVideo();
      },
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.videoSub?.unsubscribe();
    if (this.videoTimer) clearTimeout(this.videoTimer);
  }

  /* Nav handlers */
  openSearch(): void {
    this.searchWindowOpened = true;
  }

  closeSearch(event: Event): void {
    event.stopPropagation();
    this.searchWindowOpened = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /* Video rotation */
  nextVideo(): void {
    if (this.videoTimer) {
      clearTimeout(this.videoTimer);
      this.videoTimer = null;
    }

    if (!this.videoPool.length) {
      this.videoSlides = [];
      return;
    }

    if (!this.videoQueue.length) {
      this.videoQueue = this.shuffle([...this.videoPool]);
      const current = this.videoSlides[0]?.video.src;
      if (this.videoQueue.length > 1 && this.videoQueue[0].src === current) {
        this.videoQueue.push(this.videoQueue.shift()!);
      }
    }

    const video = this.videoQueue.shift()!;
    this.videoSlides = [{ id: ++this.videoSeq, video }];

    if (video.kind === 'embed' && this.videoPool.length > 1) {
      this.videoTimer = setTimeout(() => this.nextVideo(), AboutUs.EMBED_MS);
    }
  }

  onVideoLoaded(el: HTMLVideoElement): void {
    primeMutedVideo(el);
  }

  onVideoPlaying(el: HTMLElement): void {
    markReady(el);
  }

  onVideoEnded(): void {
    this.nextVideo();
  }

  onVideoError(slide: HeadSlide): void {
    this.videoPool = this.videoPool.filter((v) => v.src !== slide.video.src);
    this.videoQueue = this.videoQueue.filter((v) => v.src !== slide.video.src);
    this.nextVideo();
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* Page helpers */
  toggleFaq(i: number): void {
    this.openFaq = this.openFaq === i ? null : i;
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  goToContact(): void {
    this.router.navigate(['/contact']);
  }
}