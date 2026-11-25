import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  inject,
} from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiServices } from '../../../services/api-services';
import { setVideoExpanded, releaseMedia } from '../../portfolio/specs/chome-vid-control';

import {
  ImportCostRow,
  ImportStep,
  ImportSpec,
  FaqItem,
  ImportRequestPayload,
  IMPORT_RATES,
} from '../../../interfaces/car-interface';
import { Footer } from '../../footer/footer';

const { SHIPPING_RATE, IMPORT_DUTY, EXCISE_DUTY, VAT, IDF, RDL } = IMPORT_RATES;

@Component({
  selector: 'app-imported',
  imports: [FormsModule, DecimalPipe, NgTemplateOutlet, Footer],
  templateUrl: './imported.html',
  styleUrl: './imported.css',
})
export class Imported implements OnDestroy {

  speaker = 'speaker.png';
  speakerMuted = 'speaker-muted.png';

  private api = inject(ApiServices);
  private cdr = inject(ChangeDetectorRef);
  private submitSub?: Subscription;

  countries = ['Japan', 'United Kingdom', 'UAE', 'South Africa'];

  fuels = ['Petrol', 'Diesel', 'Hybrid'];
  makes = ['Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Isuzu', 'Volkswagen', 'Mercedes-Benz', 'BMW', 'Land Rover', 'Audi', 'Ford'];
  years = Array.from({ length: 9 }, (_, i) => new Date().getFullYear() - i);

  specs: ImportSpec[] = [
    { k: 'Sourcing', v: 'Japan · UK · UAE · South Africa', tag: 'Transportation supported' },
    { k: 'Vehicle age', v: 'Up to 8 years from manufacture', tag: '' },
    { k: 'We handle', v: 'Shipping, KRA duty, KEBS, registration', tag: 'Timely delivery.' },
    { k: 'You get', v: 'An inspection report before you commit', tag: 'Free inspection.' },
  ];

  steps: ImportStep[] = [
    {
      n: '01',
      t: 'Brief',
      d: 'Tell us the car you want and we confirm it is eligible.',
      m: 'Approx. 1 Week',
      thumb: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
      video: 'assets/steps/brief.mp4',
      points: ['Tell us the make, model and year', 'We confirm it is eligible (up to 8 years)', 'Choose Japan, UK, UAE or South Africa']
    },
    {
      n: '02',
      t: 'Source & inspect',
      d: 'We find the car overseas and send an inspection report before you commit.',
      m: 'Approx. 1 Week',
      thumb: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800&auto=format&fit=crop',
      video: 'assets/steps/source.mp4',
      points: ['We find the car overseas', 'Inspection report before you commit', 'Free, with no obligation']
    },
    {
      n: '03',
      t: 'Ship',
      d: 'Your car is shipped to Mombasa.',
      m: 'Approx. 2–6 Weeks',
      thumb: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=800&auto=format&fit=crop',
      video: 'assets/steps/ship.mp4',
      points: ['Shipped to Mombasa', 'Shipping and insurance in the estimate', 'Updates from our team along the way']
    },
    {
      n: '04',
      t: 'Clear & deliver',
      d: 'We clear it through KRA and KEBS, register it and hand you the keys.',
      m: 'Approx. 7–8 Weeks',
      thumb: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=800&auto=format&fit=crop',
      video: 'assets/steps/deliver.mp4',
      points: ['KRA duty and KEBS handled by us', 'Registration done for you', 'Keys handed over in Nairobi']
    },
  ];

  /** True while the big viewer (expanded) is open. */
  videoOpen = false;
  videoSrc = 'assets/hero.mp4';
  videoThumb = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1200&auto=format&fit=crop';
  activeSrc = this.videoSrc;
  activeThumb = this.videoThumb;

  /** Only the hero video ever plays in place. */
  inlineId: string | null = null;

  // Custom video controls (same as the trade-in and specs pages)
  vLoading = false;
  vError = false;
  vPaused = false;
  /** True when muted, or when the volume slider is at 0. */
  vMuted = false;
  /** 0 to 100. Kept between videos. */
  vVolume = 100;
  vProgress = 0;
  vCur = '0:00';
  vDur = '0:00';

  faqs: FaqItem[] = [
    { q: 'How old can an imported car be?', a: 'Kenya generally allows used vehicles up to 8 years from the year of manufacture. We confirm eligibility for the exact car before you commit to anything.' },
    { q: 'How long does it take?', a: 'About eight weeks from brief to delivery: sourcing and inspection in week 1, shipping in weeks 2–6, clearing in week 7 and delivery in week 8.' },
    { q: 'How accurate is the cost estimate?', a: 'It is indicative only. Final duty is based on the KRA valuation and the rates in force when the car is entered, so your formal quote may differ.' },
    { q: 'Can I finance an import?', a: 'Ask us about financing when you request your quote and we will walk you through the options.' },
  ];

  origin = 'Japan';
  make = 'Toyota';
  model = 'Harrier';
  year = 2025;
  fuel = 'Petrol';
  engine = '1,998';
  price = 2400000;
  priceText = '2,400,000';
  name = '';
  phone = '';
  email = '';
  notes = '';
  openFaq = 0;
  submitted = false;
  tried = false;
  /** True while the import request is in flight (disable the submit button with this). */
  submitting = false;
  /** Shown in the form when the request fails. Empty when there is no error. */
  submitError = '';
  /** Reference code returned by the backend, if any. */
  referenceCode = '';

  get shipping(): number { return Math.round(this.price * SHIPPING_RATE); }
  get cif(): number { return this.price + this.shipping; }
  get importDuty(): number { return Math.round(this.cif * IMPORT_DUTY); }
  get excise(): number { return Math.round((this.cif + this.importDuty) * EXCISE_DUTY); }
  get vat(): number { return Math.round((this.cif + this.importDuty + this.excise) * VAT); }
  get idf(): number { return Math.round(this.cif * IDF); }
  get rdl(): number { return Math.round(this.cif * RDL); }
  get total(): number { return this.cif + this.importDuty + this.excise + this.vat + this.idf + this.rdl; }

  get rows(): ImportCostRow[] {
    return [
      { label: 'Vehicle price (FOB)', value: this.price },
      { label: 'Shipping & insurance', value: this.shipping },
      { label: 'CIF value', value: this.cif, strong: true },
      { label: 'Import duty · 25%', value: this.importDuty },
      { label: 'Excise duty · 20%', value: this.excise },
      { label: 'VAT · 16%', value: this.vat },
      { label: 'IDF · 2.5%', value: this.idf },
      { label: 'RDL · 2%', value: this.rdl },
      { label: 'Total landed (est.)', value: this.total, strong: true },
    ];
  }

  onPrice(value: string): void {
    this.price = Number(value.replace(/\D/g, '')) || 0;
    this.priceText = this.price ? this.price.toLocaleString('en-US') : '';
  }

  toForm(): void {
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth' });
  }

  chooseOrigin(country: string): void {
    this.origin = country;
    this.toForm();
  }

  // ==========================================================
  // Video: hero plays in place; every step opens expanded.
  // ==========================================================

  /** The one <video> that is on screen (in place, or in the big viewer). */
  @ViewChild('pv') private pvRef?: ElementRef<HTMLVideoElement>;

  /** Time and pause state handed over when a video moves between in place and expanded. */
  private resume: { t: number; paused: boolean } | null = null;
  private lastVolume = 1;

  /** Playlist order: hero video, then steps 01 to 04. */
  private get playlist(): { id: string; video: string; thumb: string }[] {
    return [
      { id: 'main', video: this.videoSrc, thumb: this.videoThumb },
      ...this.steps.map(s => ({ id: 's' + s.n, video: s.video, thumb: s.thumb })),
    ];
  }
  get videoIndex(): number {
    return Math.max(0, this.playlist.findIndex(p => p.video === this.activeSrc));
  }
  get hasPrev(): boolean { return this.videoIndex > 0; }
  get hasNext(): boolean { return this.videoIndex < this.playlist.length - 1; }

  private beginLoad(): void {
    this.vPaused = false;
    this.vProgress = 0;
    this.vCur = '0:00';
    this.vDur = '0:00';
    this.vLoading = true;
    this.vError = false;
  }

  private releaseCurrent(): void {
    releaseMedia(this.pvRef?.nativeElement);
  }

  /** Plays the hero video right where its thumbnail sits. */
  playInline(id: string, src: string, thumb: string): void {
    this.releaseCurrent();
    this.activeSrc = src;
    this.activeThumb = thumb;
    this.resume = null;
    this.beginLoad();
    this.inlineId = id;
  }

  /** Stops the in-place hero video and puts the thumbnail back. */
  stopVideo(): void {
    this.releaseCurrent();
    this.inlineId = null;
    this.resume = null;
    this.vLoading = false;
    this.vError = false;
    this.vPaused = false;
    this.vProgress = 0;
    this.vCur = '0:00';
    this.vDur = '0:00';
  }

  /** Expands the currently playing hero video to the big viewer. */
  expandVideo(v?: HTMLVideoElement): void {
    const el = v ?? this.pvRef?.nativeElement;
    this.resume = el ? { t: el.currentTime, paused: el.paused } : null;
    this.releaseCurrent();
    this.vLoading = true;
    this.vError = false;
    this.videoOpen = true;
    document.body.style.overflow = 'hidden';
    setVideoExpanded(true);
  }

  /**
   * Opens a specific step video in the big viewer, independent of whatever
   * was playing before. Clicking any step card calls this with its own src.
   */
  expandStepVideo(video: string, thumb: string): void {
    this.releaseCurrent();
    this.activeSrc = video;
    this.activeThumb = thumb;
    this.inlineId = null;
    this.resume = null;
    this.beginLoad();
    this.videoOpen = true;
    document.body.style.overflow = 'hidden';
    setVideoExpanded(true);
  }

  /** Collapses the big viewer. Nothing plays inline afterwards. */
  closeVideo(): void {
    if (!this.videoOpen) return;
    this.releaseCurrent();
    this.videoOpen = false;
    this.inlineId = null;
    this.resume = null;
    this.vLoading = false;
    this.vError = false;
    this.vPaused = false;
    this.vProgress = 0;
    this.vCur = '0:00';
    this.vDur = '0:00';
    document.body.style.overflow = '';
    setVideoExpanded(false);
  }

  nextVideo(): void { this.go(1); }
  prevVideo(): void { this.go(-1); }

  /**
   * Next/Prev always moves inside the big viewer. If it wasn't open yet
   * (e.g. the hero video was playing in place), it opens now. No step card
   * ever plays inline from navigation.
   */
  private go(step: number): void {
    const n = this.playlist[this.videoIndex + step];
    if (!n) return;
    this.releaseCurrent();
    this.activeSrc = n.video;
    this.activeThumb = n.thumb;
    this.resume = null;
    this.inlineId = null;
    this.beginLoad();

    if (!this.videoOpen) {
      this.videoOpen = true;
      document.body.style.overflow = 'hidden';
      setVideoExpanded(true);
    }
  }

  // ---------- Video controls ----------
  onVideoStart(): void { this.vLoading = true; this.vError = false; }

  /** Metadata is in: put the saved sound on it and carry over the time when it moved. */
  onVideoMeta(v: HTMLVideoElement): void {
    this.applyAudio(v);
    const r = this.resume;
    if (r) {
      this.resume = null;
      if (r.t > 0 && isFinite(v.duration)) {
        v.currentTime = Math.min(r.t, Math.max(0, v.duration - 0.1));
      }
      if (r.paused) {
        v.autoplay = false;
        v.pause();
      }
    }
    this.onVideoTime(v);
  }

  /** Enough data to play: hide the loader and sync the play/pause icon (autoplay may be blocked). */
  onVideoReady(v: HTMLVideoElement): void {
    this.vLoading = false;
    this.vError = false;
    this.vPaused = v.paused;
    this.onVideoTime(v);
  }
  onVideoError(v?: HTMLVideoElement): void {
    // A video we just released has no src: that is not an error.
    if (v && !v.getAttribute('src')) return;
    this.vLoading = false;
    this.vError = true;
  }
  retryVideo(v: HTMLVideoElement): void {
    this.vError = false;
    this.vLoading = true;
    v.load();
    v.play().catch(() => { /* autoplay blocked: user can press play */ });
  }

  private fmt(s: number): string {
    if (!isFinite(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }
  onVideoTime(v: HTMLVideoElement): void {
    this.vCur = this.fmt(v.currentTime);
    this.vDur = this.fmt(v.duration);
    this.vProgress = v.duration ? Math.round((v.currentTime / v.duration) * 1000) : 0;
  }
  toggleVideo(v: HTMLVideoElement): void {
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }
  seekVideo(v: HTMLVideoElement, e: Event): void {
    const val = +(e.target as HTMLInputElement).value;
    if (v.duration) v.currentTime = (v.duration * val) / 1000;
  }

  // ---------- Sound: speaker icon mutes, slider sets the volume ----------
  private applyAudio(v: HTMLVideoElement): void {
    v.dataset['audio'] = '1';
    v.volume = Math.min(1, Math.max(0, this.vVolume / 100));
    v.muted = this.vMuted;
  }

  /** Speaker click: mute, or unmute (back to the last volume if it was dragged to 0). */
  toggleMute(v: HTMLVideoElement): void {
    if (v.muted || v.volume === 0) {
      if (v.volume === 0) v.volume = this.lastVolume || 1;
      v.muted = false;
    } else {
      v.muted = true;
    }
  }
  setVolume(v: HTMLVideoElement, e: Event): void {
    const val = Math.min(100, Math.max(0, +(e.target as HTMLInputElement).value));
    v.volume = val / 100;
    v.muted = val === 0;
  }
  /** Keeps the icon and slider in step with the real element. */
  onVolumeChange(v: HTMLVideoElement): void {
    if (v.dataset['audio'] !== '1') return;
    this.vMuted = v.muted || v.volume === 0;
    this.vVolume = Math.round(v.volume * 100);
    if (v.volume > 0) this.lastVolume = v.volume;
  }

  fullscreenVideo(v: HTMLVideoElement): void {
    if (v.requestFullscreen) {
      v.requestFullscreen().catch(() => {});
    } else {
      // iPhone Safari
      (v as any).webkitEnterFullscreen?.();
    }
  }

  // ---------- Hover previews (muted, looping) ----------
  previewPlay(v: HTMLVideoElement): void {
    v.muted = true;
    v.play().catch(() => { /* blocked or interrupted: the thumbnail stays visible */ });
  }
  previewShow(v: HTMLVideoElement): void { v.style.opacity = '1'; }
  previewStop(v: HTMLVideoElement): void {
    v.pause();
    v.currentTime = 0;
    v.style.opacity = '0';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    // Esc collapses the big viewer.
    if (this.videoOpen) {
      this.closeVideo();
    }
  }

  ngOnDestroy(): void {
    this.submitSub?.unsubscribe();
    this.releaseCurrent();
    setVideoExpanded(false);
    document.body.style.overflow = '';
  }

  attempt(valid: boolean | null): void {
    this.tried = true;
    if (valid) {
      this.submit();
    }
  }

  /** Sends the quote request to POST /api/requests/import. */
  submit(): void {
    if (this.submitting) return;

    const payload: ImportRequestPayload = {
      origin: this.origin,
      make: this.make,
      model: this.model,
      year: this.year,
      fuel: this.fuel,
      engine: this.engine,
      price: this.price,
      name: this.name.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      notes: this.notes.trim(),
    };

    // The estimate the customer was looking at, so the team sees the same numbers.
    const body = {
      ...payload,
      estimate: {
        shipping: this.shipping,
        cif: this.cif,
        importDuty: this.importDuty,
        excise: this.excise,
        vat: this.vat,
        idf: this.idf,
        rdl: this.rdl,
        total: this.total,
      },
    };

    this.submitting = true;
    this.submitError = '';
    this.submitSub?.unsubscribe();
    this.submitSub = this.api.submitImport(body).subscribe({
      next: (res) => {
        this.submitting = false;
        this.submitted = true;
        this.referenceCode = res?.code ?? res?.id ?? '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting = false;
        this.submitError =
          err?.error?.message ||
          (err?.status === 0
            ? 'Could not reach the server. Check your connection and try again.'
            : 'We could not send your request. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }
}