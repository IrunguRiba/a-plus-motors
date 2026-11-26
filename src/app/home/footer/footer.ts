import {
  Component,
  ElementRef,
  NgZone,
  AfterViewInit,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SafeVideoUrlPipe } from '../portfolio/specs/safe-url.pipe';
import { ApiServices } from '../../services/api-services';
import {
  ReviewVideo,
  resolveReviewVideo,
  primeMutedVideo,
  markReady,
  prefersReducedMotion,
} from '../portfolio/specs/review-video';

interface FooterLink {
  label: string;
  path: string;
  query?: Record<string, string>;
}

interface FooterGroup {
  key: string;
  title: string;
  links: FooterLink[];
}

interface Social {
  label: string;
  icon: string;
  href: string;
}

interface FooterSlide {
  id: number;
  video: ReviewVideo;
}

@Component({
  selector: 'app-footer',
  imports: [SafeVideoUrlPipe, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit, AfterViewInit, OnDestroy {
  currentYear = new Date().getFullYear();
  copyright = 'copyright.png';
  legal = 'insurance.png';

  /** Same logo as the nav. */
  logoImg = 'fav3.png';

  /** Link groups mirror the nav menu. */
  footerMenu: FooterGroup[] = [
    {
      key: 'home',
      title: 'Explore',
      links: [
        { label: 'Featured Cars', path: '/store' },
        { label: 'New Arrivals', path: '/store' },
        { label: 'Latest Offers', path: '/store' },
        { label: 'Blogs', path: '/blogs' },
      ],
    },
    {
      key: 'buycar',
      title: 'Showroom',
      links: [
        { label: 'All Cars', path: '/store' },
        { label: 'New Cars', path: '/store' },
        { label: 'Import', path: '/imported-trade-in', query: { tab: 'import' } },
        { label: 'Trade-in', path: '/imported-trade-in', query: { tab: 'trade-in' } },
      ],
    },
    {
      key: 'financing',
      title: 'Financing',
      links: [
        { label: 'Loan Options', path: '/financing', query: { tab: 'options' } },
        { label: 'Calculate Payments', path: '/financing', query: { tab: 'calculator' } },
        { label: 'Apply Now', path: '/financing', query: { tab: 'apply' } },
        { label: 'Insurance Partners', path: '/financing', query: { tab: 'insurance' } },
      ],
    },
    {
      key: 'about',
      title: 'About Us',
      links: [
        { label: 'Our Story', path: '/about-us' },
        { label: 'Our Team', path: '/about-us' },
        { label: 'Careers', path: '/about-us' },
        { label: 'News & Media', path: '/about-us' },
      ],
    },
    {
      key: 'subsidiaries',
      title: 'Subsidiaries',
      links: [
        { label: 'A Plus Motors', path: '/about-us' },
        { label: 'A Plus Finance', path: '/about-us' },
        { label: 'A Plus Insurance', path: '/about-us' },
        { label: 'A Plus Auto Parts', path: '/about-us' },
      ],
    },
  ];

  /** Same icons as the nav. Fill in the empty hrefs with your real profile URLs. */
  socials: Social[] = [
    { label: 'Instagram', icon: 'ig.png', href: '' },
    { label: 'Facebook', icon: 'facebook.png', href: '' },
    { label: 'Twitter', icon: 'twitter.png', href: '' },
    { label: 'YouTube', icon: 'youtube.png', href: '' },
    { label: 'WhatsApp', icon: 'whatsapp.png', href: 'https://wa.me/254707555666' },
    { label: 'Call us', icon: 'call.png', href: 'tel:+254707555666' },
    { label: 'Email us', icon: 'gmail.png', href: 'mailto:info@aplusmotors.biz' },
  ];

  // ============== BACKGROUND VIDEO (same approach as the home hero) ==============

  private static readonly EMBED_MS = 25000;

  /** All review videos found on the web cars. */
  videoPool: ReviewVideo[] = [];
  /** 0 or 1 items: the review video currently playing behind the footer. */
  videoSlides: FooterSlide[] = [];
  /** Only true while the footer is near the viewport, so nothing plays off-screen. */
  videoActive = false;

  private videoQueue: ReviewVideo[] = [];
  private videoSeq = 0;
  private videoTimer: ReturnType<typeof setTimeout> | null = null;
  private videoSub?: Subscription;
  private observer?: IntersectionObserver;

  private api = inject(ApiServices);
  private zone = inject(NgZone);
  private host = inject(ElementRef<HTMLElement>);

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (prefersReducedMotion()) return; // keep the calm dark footer, no motion

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
      error: () => { /* no video: the footer stays on its dark background */ },
    });
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.videoActive = true;
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        this.zone.run(() => (this.videoActive = visible));
      },
      { rootMargin: '300px 0px 300px 0px' }
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.videoSub?.unsubscribe();
    if (this.videoTimer) clearTimeout(this.videoTimer);
  }

  /** Picks the next random review (every video plays once before any repeats). */
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

    // Embeds loop forever and give no "ended" event, so rotate them on a timer.
    if (video.kind === 'embed' && this.videoPool.length > 1) {
      this.videoTimer = setTimeout(() => this.nextVideo(), Footer.EMBED_MS);
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

  /** A video that can't be played is dropped from the pool; the next one starts. */
  onVideoError(slide: FooterSlide): void {
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

  // ============== NAVIGATION ==============

  /** Click on the footer logo — same behavior as the nav logo (scroll to top). */
  goHome(event?: Event): void {
    event?.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  go(target: FooterLink, event?: Event): void {
    event?.preventDefault();
    this.router.navigate([target.path], target.query ? { queryParams: target.query } : {});
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