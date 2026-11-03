import {
  Component, ElementRef, AfterViewInit, OnDestroy, ViewChild, HostListener, inject
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, CanDeactivateFn } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

type CarView = 'exterior' | 'interior';

interface SpecRow { label: string; value: string; }
interface SpecGroup { title: string; rows: SpecRow[]; }

@Component({
  selector: 'app-specs',
  templateUrl: './specs.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./specs.css'],
  host: { style: 'overflow: clip' }
})
export class Specs implements AfterViewInit, OnDestroy {
  constructor(private router: Router) {
    this.jumpToTop();
  }

  private location = inject(Location);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('modalRoot') modalRoot!: ElementRef<HTMLElement>;
  @ViewChild('videoRoot') videoRoot!: ElementRef<HTMLElement>;

  private jumpToTop(): void {
    ScrollSmoother.get()?.scrollTo(0, false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }

  // ---------- Car data ----------
  seriesName = 'BMW i4 Series';
  carName = 'BMW i4 eDrive40';
  shortDesc = 'Pure electric gran coupé · 335 hp · 0-60 in 5.5s · 301 mi range';
  carPrice = 'Ksh 7,056,395';

  // ---------- Specs: Exterior only ----------
  exteriorSpecs: SpecGroup[] = [
    {
      title: 'Engine & Performance',
      rows: [
        { label: 'Powertrain', value: 'Pure electric' },
        { label: 'Horsepower', value: '335 hp' },
        { label: 'Torque', value: '317 lb-ft' },
        { label: '0–60 mph', value: '5.5 s' },
        { label: 'Top speed', value: '118 mph' },
        { label: 'Drivetrain', value: 'Rear-wheel drive' }
      ]
    },
    {
      title: 'Battery & Range',
      rows: [
        { label: 'Battery', value: '83.9 kWh lithium-ion' },
        { label: 'Range', value: '301 mi (EPA)' },
        { label: 'DC fast charge', value: '10–80% in 31 min' },
        { label: 'AC charge', value: '11 kW onboard' }
      ]
    },
    {
      title: 'Exterior Dimensions',
      rows: [
        { label: 'Length', value: '188.5 in' },
        { label: 'Width', value: '72.9 in' },
        { label: 'Height', value: '57.0 in' },
        { label: 'Wheelbase', value: '112.2 in' },
        { label: 'Wheels', value: '18" aero alloy' }
      ]
    },
    {
      title: 'Exterior Features',
      rows: [
        { label: 'Headlights', value: 'Adaptive LED' },
        { label: 'Roof', value: 'Body-colour with sunroof' },
        { label: 'Mirrors', value: 'Heated, power-folding' },
        { label: 'Paint', value: 'Alpine White Metallic' }
      ]
    }
  ];

  // ---------- Specs: Interior only ----------
  interiorSpecs: SpecGroup[] = [
    {
      title: 'Comfort & Seating',
      rows: [
        { label: 'Seats', value: 'Heated, 4-way lumbar' },
        { label: 'Upholstery', value: 'Vernasca leather' },
        { label: 'Front seats', value: 'Power, memory' },
        { label: 'Rear seats', value: '40/20/40 split' }
      ]
    },
    {
      title: 'Infotainment',
      rows: [
        { label: 'Display', value: '12.3" + 14.9" curved' },
        { label: 'System', value: 'BMW OS 8.5' },
        { label: 'Audio', value: 'Harman Kardon 16-speaker' },
        { label: 'Connectivity', value: 'Wireless Apple CarPlay / Android Auto' },
        { label: 'Charging', value: 'Wireless + USB-C' }
      ]
    },
    {
      title: 'Cabin Features',
      rows: [
        { label: 'Climate', value: 'Dual-zone auto' },
        { label: 'Roof', value: 'Panoramic glass' },
        { label: 'Lighting', value: 'Ambient LED' },
        { label: 'Cargo', value: '10.0 cu ft' }
      ]
    },
    {
      title: 'Driver Assistance',
      rows: [
        { label: 'Cruise', value: 'Adaptive with stop & go' },
        { label: 'Parking', value: 'Rear camera + sensors' },
        { label: 'Safety', value: 'Lane keep, blind spot' },
        { label: 'Airbags', value: '8 total' }
      ]
    }
  ];

  exteriorImages: string[] = [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop&q=80',
    '1.png',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=80'
  ];

  interiorImages: string[] = [
    'interior-1.jpg',
    'interior-2.jpg',
    'interior-3.jpg',
    'interior-4.jpg',
    'interior-5.jpg',
    'interior-6.jpg'
  ];

  reviewVid = '2.mp4';
  videoFullscreen = false;

  // Updated to include year and brand to match the store UI exactly
  similarVehicles = [
    { 
      name: 'BMW i4 M50', 
      price: 'Ksh 1,367,300', 
      year: '2023', 
      brand: 'BMW', 
      image: '1.png' 
    },
    { 
      name: 'BMW iX xDrive50', 
      price: 'Ksh 1,087,100', 
      year: '2023', 
      brand: 'BMW', 
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&auto=format&fit=crop&q=80' 
    },
    { 
      name: 'BMW i7 xDrive60', 
      price: 'Ksh 2,119,300', 
      year: '2023', 
      brand: 'BMW', 
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=80' 
    }
  ];

  // ---------- State ----------
  view: CarView = 'exterior';
  activeIndex = 0;
  stackExpanded = false; // Restored for the expand toggle

  get images(): string[] {
    return this.view === 'exterior' ? this.exteriorImages : this.interiorImages;
  }

  get activeImage(): string {
    return this.images[this.activeIndex] ?? '';
  }

  get counter(): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(this.activeIndex + 1)} / ${pad(this.images.length)}`;
  }

  setView(v: CarView): void {
    if (v === this.view) return;
    this.view = v;
    this.activeIndex = 0;
    this.stackExpanded = false; // Reset expansion when switching views
    this.revealActiveThumb();
  }

  next(): void {
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
    this.revealActiveThumb();
  }

  prev(): void {
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
    this.revealActiveThumb();
  }

  selectImage(i: number): void {
    this.activeIndex = i;
    this.revealActiveThumb();
  }

  toggleStack(): void {
    this.stackExpanded = !this.stackExpanded;
    this.revealActiveThumb();
  }

  // Keep the active thumbnail visible inside the independently scrolling stack
  private revealActiveThumb(): void {
    setTimeout(() => {
      const track = this.host.nativeElement.querySelector<HTMLElement>('.stack-track');
      const el = track?.querySelector<HTMLElement>('.stack-thumb.active');
      if (!track || !el) return;
      if (track.scrollHeight > track.clientHeight + 1) {
        track.scrollTo({ top: el.offsetTop - track.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
      } else if (track.scrollWidth > track.clientWidth + 1) {
        track.scrollTo({ left: el.offsetLeft - track.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
      }
    }, 60);
  }

  onScrollerWheel(event: WheelEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (el.scrollHeight <= el.clientHeight + 1) return;
    
    const atTop = el.scrollTop <= 0 && event.deltaY < 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && event.deltaY > 0;
    
    if (atTop || atBottom) return;
    
    el.scrollTop += event.deltaY;
    event.preventDefault();
  }

  // ---------- Swipe ----------
  private touchX = 0;
  onTouchStart(e: TouchEvent): void { this.touchX = e.changedTouches[0].clientX; }
  onTouchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.touchX;
    if (Math.abs(dx) < 50) return;
    dx < 0 ? this.next() : this.prev();
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void { if (!this.modalOpen && !this.videoFullscreen) this.next(); }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void { if (!this.modalOpen && !this.videoFullscreen) this.prev(); }

  // ---------- Interest modal ----------
  logoImg = 'fav3.png';
  phoneImg = 'call.png';
  whatsappImg = 'whatsapp.png';
  youtubeImg = 'youtube.png';
  phoneTel = '+254707555666';
  whatsappNumber = '254707555666';

  modalOpen = false;
  submitted = false;
  attempted = false;
  shareLabel = 'Share car link';

  timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  minDate = new Date().toLocaleDateString('en-CA');

  form = this.emptyForm();

  private emptyForm() {
    return {
      name: '',
      phone: '',
      schedule: false,
      date: '',
      time: '10:00',
      tradeIn: false,
      tradeMake: '',
      tradeYear: '',
      tradeMileage: ''
    };
  }

  get nameValid(): boolean { return this.form.name.trim().length >= 2; }
  get phoneValid(): boolean { return /^\+?[\d\s-]{9,16}$/.test(this.form.phone.trim()); }
  get dateValid(): boolean { return !this.form.schedule || !!this.form.date; }
  get tradeValid(): boolean { return !this.form.tradeIn || this.form.tradeMake.trim().length >= 2; }
  get formValid(): boolean { return this.nameValid && this.phoneValid && this.dateValid && this.tradeValid; }

  get waLink(): string {
    const f = this.form;
    const lines = [
      `Hello A Plus Motors, I'm interested in the ${this.carName} (${this.carPrice}).`,
      `Name: ${f.name.trim()}`,
      `Phone: ${f.phone.trim()}`
    ];
    if (f.schedule) lines.push(`Viewing: ${f.date} at ${f.time}`);
    if (f.tradeIn) {
      const extra = [f.tradeYear.trim(), f.tradeMileage.trim() ? f.tradeMileage.trim() + ' km' : '']
        .filter(Boolean).join(', ');
      lines.push(`Trade-in: ${f.tradeMake.trim()}${extra ? ' (' + extra + ')' : ''}`);
    }
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  openModal(): void {
    if (this.submitted) {
      this.form = this.emptyForm();
      this.submitted = false;
      this.attempted = false;
    }
    this.modalOpen = true;
    this.lockScroll(true);
    setTimeout(() => this.modalRoot?.nativeElement.querySelector<HTMLInputElement>('input')?.focus(), 450);
  }

  closeModal(): void {
    if (!this.modalOpen) return;
    this.modalOpen = false;
    if (!this.videoFullscreen) this.lockScroll(false);
  }

  submitInterest(): void {
    this.attempted = true;
    if (!this.formValid) return;
    this.submitted = true;
    this.modalRoot?.nativeElement.querySelector('.im-scroll')?.scrollTo({ top: 0 });
  }

  async shareCar(): Promise<void> {
    const url = window.location.href;
    const data = { title: this.carName, text: `${this.carName} · ${this.carPrice} — A Plus Motors`, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      this.shareLabel = 'Link copied';
      setTimeout(() => (this.shareLabel = 'Share car link'), 2000);
    } catch {
      /* share sheet dismissed or clipboard blocked */
    }
  }

  goModal(route: string): void {
    this.closeModal();
    this.leaveAndGo([route]);
  }

  // ---------- Store Card Actions ----------
  likeCar(car: any, event: Event): void {
    event.stopPropagation();
    console.log('Liked:', car.name);
    // Add logic to toggle like state
  }

  bookmarkCar(car: any, event: Event): void {
    event.stopPropagation();
    console.log('Bookmarked:', car.name);
    // Add logic to toggle bookmark state
  }

  shareCarItem(car: any, event: Event): void {
    event.stopPropagation();
    // Reuse share logic or add specific car share logic
    if (navigator.share) {
      navigator.share({
        title: car.name,
        text: `Check out this ${car.name} at A Plus Motors`,
        url: window.location.href // Ideally a link to the car
      }).catch(() => {});
    }
  }

  inquireCar(car: any, event: Event): void {
    event.stopPropagation();
    // Navigate to specs or open a specific modal for this car
    this.goToSpecs(); 
  }

  // ---------- Navigation ----------
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.videoFullscreen) this.closeVideo(new Event('escape'));
    else this.closeModal();
  }

  private lockScroll(lock: boolean): void {
    document.body.style.overflow = lock ? 'hidden' : '';
    ScrollSmoother.get()?.paused(lock);
  }

  // ---------- Lifecycle ----------
  ngAfterViewInit(): void {
    this.jumpToTop();

    document.body.appendChild(this.modalRoot.nativeElement);
    document.body.appendChild(this.videoRoot.nativeElement);

    gsap.fromTo(
      this.panels,
      { scale: 1.15, transformOrigin: 'center center' },
      { scale: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform' }
    );
  }

  private get panels(): Element[] {
    return Array.from(this.host.nativeElement.querySelectorAll('.hero-page, .similar-section'));
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
    this.modalRoot?.nativeElement.remove();
    this.videoRoot?.nativeElement.remove();
    this.lockScroll(false);
  }

  // ---------- Video ----------
  openVideo(event: Event): void {
    event.stopPropagation();
    this.videoFullscreen = true;
    this.lockScroll(true);
  }

  closeVideo(event: Event): void {
    event.stopPropagation();
    this.videoFullscreen = false;
    if (!this.modalOpen) this.lockScroll(false);
  }

  // ---------- Navigation ----------
  async goBack() {
    await this.playLeave();
    this.location.back();
  }

  goToMainStore(): void { this.leaveAndGo(['/store']); }
  goToContact(): void { this.leaveAndGo(['/contact']); }
  goToSpecs(): void { this.leaveAndGo(['/specs']); }
  openFinancing(): void { this.leaveAndGo(['/financing']); }
}

export const specsLeaveGuard: CanDeactivateFn<Specs> = component =>
  component.playLeave().then(() => true);