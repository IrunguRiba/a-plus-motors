import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Nav } from '../nav/nav';
import { SafeVideoUrlPipe } from '../portfolio/specs/safe-url.pipe';
import { ApiServices } from '../../services/api-services';
import {
  ReviewVideo,
  resolveReviewVideo,
  primeMutedVideo,
  markReady,
  prefersReducedMotion,
} from '../portfolio/specs/review-video';
import { Footer } from '../footer/footer';

interface HeadSlide {
  id: number;
  video: ReviewVideo;
}

type RequiredField = 'firstName' | 'lastName' | 'email' | 'phone' | 'category' | 'accept';

@Component({
  selector: 'app-contacts',
  imports: [Nav, ReactiveFormsModule, SafeVideoUrlPipe, Footer],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css',
})
export class Contacts implements OnInit, OnDestroy {
  private static readonly EMBED_MS = 25000;

  private static readonly SEND_LABELS: Record<string, string> = {
    'Buy a Car': 'Send Buy Car Request',
    'Import a Car': 'Send Import Request',
    'Trade In': 'Send Trade In Request',
    'Financing': 'Send Financing Request',
    'Complaint': 'Send Complaint',
    'General Inquiry': 'Send Inquiry Request',
  };

  private fb = inject(FormBuilder);
  private api = inject(ApiServices);

  logoImg = 'fav3.png';
  isMenuOpen = false;
  searchWindowOpened = false;

  sent = false;

  videoPool: ReviewVideo[] = [];
  videoSlides: HeadSlide[] = [];

  private videoQueue: ReviewVideo[] = [];
  private videoSeq = 0;
  private videoTimer: ReturnType<typeof setTimeout> | null = null;
  private videoSub?: Subscription;

  branches = [
    { city: 'Nairobi', email: 'sales@aplusmotors.co.ke', phone: '+254 700 000 001', tel: '+254700000001' },
    { city: 'Mombasa', email: 'mombasa@aplusmotors.co.ke', phone: '+254 700 000 002', tel: '+254700000002' },
    { city: 'Kiambu', email: 'kiambu@aplusmotors.co.ke', phone: '+254 700 000 003', tel: '+254700000003' },
  ];

  departments = [
    { title: 'Car Import', email: 'import@aplusmotors.co.ke', phone: '+254 700 000 004', tel: '+254700000004' },
    { title: 'Trade In', email: 'tradein@aplusmotors.co.ke', phone: '+254 700 000 005', tel: '+254700000005' },
    { title: 'Financing', email: 'finance@aplusmotors.co.ke', phone: '+254 700 000 006', tel: '+254700000006' },
  ];

  categories = ['Buy a Car', 'Import a Car', 'Trade In', 'Financing', 'Complaint', 'General Inquiry'];

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    category: ['', Validators.required],
    message: [''],
    accept: [false, Validators.requiredTrue],
  });

  get sendLabel(): string {
    return Contacts.SEND_LABELS[this.form.controls.category.value] ?? 'Send';
  }

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
      this.videoTimer = setTimeout(() => this.nextVideo(), Contacts.EMBED_MS);
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

  error(name: RequiredField): string {
    const c = this.form.controls[name];
    if (!c.invalid || !(c.touched || c.dirty)) return '';
    if (c.errors?.['email']) return 'Enter a valid email address';
    return 'This field is required';
  }

  submit() {
    this.sent = false;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.sent = true;
    this.form.reset({ category: '', accept: false });
  }
}