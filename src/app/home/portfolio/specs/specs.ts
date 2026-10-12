import { Component, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, CanDeactivateFn } from '@angular/router';
import { Location } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

@Component({
  selector: 'app-specs',
  templateUrl: './specs.html',
  imports: [CommonModule],
  styleUrls: ['./specs.css'],
  host: { style: 'overflow: clip' }
})
export class Specs implements AfterViewInit, OnDestroy {
  constructor(private router: Router) {
    this.jumpToTop();
  }

  private jumpToTop(): void {
    ScrollSmoother.get()?.scrollTo(0, false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }
  private location = inject(Location);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  activeImage = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop&q=80';

  previewImages: string[] = [
    '1.png',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80'
  ];

  stackExpanded = false;
  reviewVid = '2.mp4';

  videoFullscreen = false;

  carName = 'BMW i4 eDrive40';
  shortDesc = [
    'Pure electric gran coupé · 335 hp · 0-60 in 5.5s · 301 mi range',
    'Performance hybrid SUV · 416 hp · Intelligent AWD · Executive seating',
    'Performance hybrid SUV · 416 hp · Intelligent AWD · Executive seating'
  ];
  carPrice = 'Ksh 7,056,395';
  carLength = '4.9 m';
  carRange = '301 mi';
  carTopSpeed = '118 mph';
  carAcceleration = '5.5 s';

  overviewSpecs = [
    { label: 'Range', value: '301 mi' },
    { label: 'Top Speed', value: '118 mph' },
    { label: '0-60 mph', value: '5.5 s' },
    { label: 'Drive', value: 'RWD' }
  ];

  comfortFeatures = [
    'Heated seats',
    'Panoramic roof',
    'Harman Kardon',
    'Wireless charging',
    'Ambient lighting',
    'Adaptive cruise'
  ];

  similarVehicles = [
    { name: 'BMW i4 M50', price: 'Ksh 1,367,300', image: '1.png' },
    { name: 'BMW iX xDrive50', price: 'Ksh 1,087,100', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&auto=format&fit=crop&q=80' },
    { name: 'BMW i7 xDrive60', price: 'Ksh 2,119,300', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=80' }
  ];

  ngAfterViewInit(): void {
    this.jumpToTop();
    gsap.fromTo(
      this.panels,
      { scale: 1.15, transformOrigin: 'center center' },
      {
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        clearProps: 'transform'
      }
    );
  }

  private get panels(): Element[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll('.hero-page, .more-specs')
    );
  }

  private leavePromise?: Promise<void>;

  playLeave(): Promise<void> {
    if (!this.leavePromise) {
      this.leavePromise = new Promise(resolve => {
        gsap.to(this.panels, {
          opacity: 0,
          scale: 0.96,
          transformOrigin: 'center center',
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => resolve()
        });
      });
    }
    return this.leavePromise;
  }

  private async leaveAndGo(commands: any[]): Promise<void> {
    await this.playLeave();
    const navigated = await this.router.navigate(commands);
    if (!navigated) {
      this.leavePromise = undefined;
      gsap.to(this.panels, {
        opacity: 1,
        scale: 1,
        duration: 0.65,
        ease: 'power2.inOut',
        clearProps: 'opacity,transform'
      });
    }
  }

  ngOnDestroy(): void {
    gsap.killTweensOf(this.panels);
  }

  toggleStack(event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('.stack-thumb')) return;
    this.stackExpanded = !this.stackExpanded;
  }

  selectImage(img: string, event: Event) {
    event.stopPropagation();
    this.activeImage = img;
    this.stackExpanded = false;
  }

  onScrollerWheel(event: WheelEvent) {
    const el = event.currentTarget as HTMLElement;
    el.scrollTop += event.deltaY;
    event.preventDefault();
  }

  openVideo(event: Event) {
    event.stopPropagation();
    this.videoFullscreen = true;
    document.body.style.overflow = 'hidden';
  }

  closeVideo(event: Event) {
    event.stopPropagation();
    this.videoFullscreen = false;
    document.body.style.overflow = '';
  }

  async goBack() {
    await this.playLeave();
    this.location.back();
  }

  goToMainStore(): void {
    this.leaveAndGo(['/store']);
  }

  goToContact() {
    this.leaveAndGo(['/contact']);
  }

  goToSpecs(): void {
    this.leaveAndGo(['/specs']);
  }

  openFinancing() {
    this.leaveAndGo(['/financing']);
  }
}

export const specsLeaveGuard: CanDeactivateFn<Specs> = component =>
  component.playLeave().then(() => true);