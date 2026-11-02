import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Nav2 } from '../nav-2/nav-2';

interface Comment {
  id: number;
  author: string;
  time: string;
  text: string;
  verified: boolean;
}

/** One piece of a story: a paragraph, a pull quote, or a photo with caption + credit. */
interface Block {
  type: 'p' | 'quote' | 'img';
  text?: string;
  url?: string;
  caption?: string;
  credit?: string;
  wide?: boolean;
}

interface BlogPost {
  id: number;
  kind: 'blog' | 'fact';
  title: string;
  author: string;
  handle: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  excerpt: string;
  imageUrl: string;
  imageCaption: string;
  imageCredit: string;
  body: Block[];
  likes: number;
  liked: boolean;
  bookmarked: boolean;
  comments: Comment[];
}

/** A piece of side information shown in the side rails of the story modal. */
interface SideInformation {
  id: string;
  type: 'car' | 'video' | 'finance' | 'service';
  tag: string;
  kicker: string;
  title: string;
  text: string;
  ticker: string;
  cta: string;
  imageUrl: string;
  videoUrl?: string;
  specs?: string[];
  price?: string;
  priceLabel?: string;
  carPrice?: number;
  rate?: number;
  months?: number;
}

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

// Placeholder photos. Replace with your own pictures (tyres, oil, battery, your showroom...).
const IMG = {
  a: photo('photo-1552519507-da3b142c6e3d'),
  b: photo('photo-1503376780353-7e6692767b70'),
  c: photo('photo-1544829099-b9a0c07fad1a'),
  d: photo('photo-1494976388531-d1058494cdd8'),
  e: photo('photo-1492144534655-ae79c964c9d7'),
};
const CREDIT = 'Photo: Unsplash';

// Placeholder videos. Replace with your own short, muted clips (mp4).
const VIDEO = {
  drive: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  road: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
};

// The modal switches to a single column and inline side information below this width.
const WIDE_SCREEN_MIN = 1240;

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, Nav2],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
})
export class Blog implements AfterViewInit, OnDestroy {
  currentMainTab: 'blogs' | 'store' | 'home' = 'blogs';
  currentFilter: 'latest' | 'popular' | 'bookmarked' | 'all' = 'latest';
  isVerifiedCustomer = false;
  toastMessage: string | null = null;
  private toastTimeout: any;

  selectedBlog: BlogPost | null = null;

  // Two random side-information items picked every time the modal opens
  sideInfoLeft: SideInformation | null = null;
  sideInfoRight: SideInformation | null = null;
  wideScreen = typeof window !== 'undefined' ? window.innerWidth >= WIDE_SCREEN_MIN : true;

  @ViewChildren('blogArticle') blogArticles!: QueryList<ElementRef>;
  @ViewChildren('factPost') factPosts!: QueryList<ElementRef>;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private host: ElementRef<HTMLElement>
  ) {}

  ngAfterViewInit(): void {
    this.animateBlogsIn();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('window:resize')
  onResize(): void {
    this.wideScreen = window.innerWidth >= WIDE_SCREEN_MIN;
  }

  private allPostEls(): HTMLElement[] {
    const blogs = this.blogArticles ? this.blogArticles.map(el => el.nativeElement as HTMLElement) : [];
    const facts = this.factPosts ? this.factPosts.map(el => el.nativeElement as HTMLElement) : [];
    return [...facts, ...blogs];
  }

  /**
   * Entrance animation. GSAP inline styles are cleared per element when its
   * tween finishes so cards go back to plain, clickable DOM.
   */
  animateBlogsIn(): void {
    const els = this.allPostEls();
    if (!els.length) return;

    gsap.killTweensOf(els);
    gsap.set(els, { clearProps: 'opacity,transform' });

    gsap.fromTo(
      els,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
        onComplete: () => {
          els.forEach(el => {
            el.style.removeProperty('opacity');
            el.style.removeProperty('transform');
            el.style.removeProperty('pointer-events');
          });
        }
      }
    );
  }

  goHome() {
    this.router.navigate(['']);
  }

  goToStore() {
    this.router.navigate(['/store']);
  }

  /* ---------- Side information (side rails of the modal) ---------- */

  // Placeholder cars, prices and finance terms. Replace with your real stock and partner terms.
  private sideInfoPool: SideInformation[] = [
    {
      id: 'car-harrier',
      type: 'car',
      tag: 'Recommended car',
      kicker: 'Just arrived',
      title: 'Toyota Harrier Premium',
      text: 'One owner, full service history and a spotless cabin. Ready to drive away this week.',
      ticker: 'Right-hand drive • Full history • Inspected by our workshop • Warranty included •',
      cta: 'View this car',
      imageUrl: IMG.a,
      specs: ['2018', '2.0L Petrol', 'Auto', '42,000 km'],
      price: 'KES 3,450,000',
      priceLabel: 'Cash price'
    },
    {
      id: 'video-testdrive',
      type: 'video',
      tag: 'Live',
      kicker: 'Test drive',
      title: 'Feel it before you buy it.',
      text: 'Book a slot and take any car in our showroom for a proper drive around Nairobi.',
      ticker: 'Book a test drive • Same-day slots • No pressure • Bring a friend •',
      cta: 'Book a test drive',
      imageUrl: IMG.d,
      videoUrl: VIDEO.drive
    },
    {
      id: 'finance-monthly',
      type: 'finance',
      tag: 'Financing',
      kicker: 'Pay monthly',
      title: 'Drive today. Pay over time.',
      text: 'Slide to see what a monthly payment could look like with our financing partners.',
      ticker: 'Flexible terms • Quick approval • Trade-ins welcome • Bank partners •',
      cta: 'Explore financing',
      imageUrl: IMG.c,
      carPrice: 2400000,
      rate: 12,
      months: 48
    },
    {
      id: 'car-forester',
      type: 'car',
      tag: 'Recommended car',
      kicker: 'Family favourite',
      title: 'Subaru Forester XT',
      text: 'Symmetrical all-wheel drive, roomy boot and the confidence to handle any road.',
      ticker: 'All-wheel drive • Family ready • Fresh service • Low mileage •',
      cta: 'View this car',
      imageUrl: IMG.e,
      specs: ['2017', '2.0L Turbo', 'Auto', '58,000 km'],
      price: 'KES 2,950,000',
      priceLabel: 'Cash price'
    },
    {
      id: 'video-import',
      type: 'video',
      tag: 'Live',
      kicker: 'Import a car',
      title: 'Your dream car, shipped to Nairobi.',
      text: 'Tell us the car you want. We handle sourcing, shipping and clearing, and you track every step.',
      ticker: 'Japan • UK • Full import service • Landed-cost quote in minutes •',
      cta: 'Start an import',
      imageUrl: IMG.b,
      videoUrl: VIDEO.road
    },
    {
      id: 'service-tradein',
      type: 'service',
      tag: 'Trade in',
      kicker: 'Upgrade',
      title: 'Your old car is worth more than you think.',
      text: 'Get a fair valuation and book an inspection. Trade it in against your next car in one visit.',
      ticker: 'Free valuation • Inspection booking • Fast payout • Upgrade today •',
      cta: 'Value my car',
      imageUrl: IMG.d
    }
  ];

  private randomOf<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)];
  }

  /** Left side info is always a random video. Right side info is a random different item, preferring a non-video. */
  private pickSideInformations(): void {
    const videos = this.sideInfoPool.filter(a => a.type === 'video');
    const left = this.randomOf(videos.length ? videos : this.sideInfoPool);
    const others = this.sideInfoPool.filter(a => a.id !== left.id);
    const nonVideo = others.filter(a => a.type !== 'video');
    this.sideInfoLeft = left;
    this.sideInfoRight = this.randomOf(nonVideo.length ? nonVideo : others);
  }

  onSideInfoClick(sideInfo: SideInformation): void {
    this.closeBlog();
    this.goToStore();
  }

  /** Indicative monthly payment: 20% deposit, fixed rate, equal instalments. */
  monthly(sideInfo: SideInformation): string {
    const price = sideInfo.carPrice || 0;
    const months = sideInfo.months || 48;
    const rate = (sideInfo.rate || 0) / 1200;
    const principal = price * 0.8;
    const payment = rate === 0
      ? principal / months
      : (principal * rate) / (1 - Math.pow(1 + rate, -months));
    return this.formatKes(payment);
  }

  setMonths(sideInfo: SideInformation, event: Event): void {
    sideInfo.months = Number((event.target as HTMLInputElement).value);
  }

  formatKes(value?: number): string {
    return Math.round(value || 0).toLocaleString('en-KE');
  }

  /* ---------- "Did you know" posts (left column) ---------- */

  facts: BlogPost[] = [
    {
      id: 11,
      kind: 'fact',
      title: 'Why your tyres lose pressure when it gets cold',
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'Did you know',
      date: 'Garage notes',
      readTime: '2 min read',
      tags: ['Tyres', 'Safety', 'Maintenance'],
      excerpt: 'Tyre pressure drops by roughly 1 psi for every 10°F (about 5.5°C) fall in temperature, so check it when the weather turns.',
      imageUrl: IMG.d,
      imageCaption: 'Tyres are the only part of the car that touches the road.',
      imageCredit: CREDIT,
      body: [
        { type: 'p', text: 'Tyre pressure drops by roughly 1 psi for every 10°F (about 5.5°C) fall in temperature, so check it when the weather turns. Air contracts as it cools, and a tyre that was perfect at midday can be noticeably soft by the next morning.' },
        { type: 'img', url: IMG.a, caption: 'A small change in pressure changes how the car grips and brakes.', credit: CREDIT },
        { type: 'p', text: 'Under-inflated tyres wear faster on the edges, heat up more at speed and make the car feel heavier to steer. They also use more fuel, because more rubber is pressed against the road.' },
        { type: 'quote', text: 'Check your tyres cold, before the first drive of the day.' },
        { type: 'p', text: 'The right pressure is not printed on the tyre wall. That number is the tyre’s maximum. Look for the placard on the driver’s door frame or in the owner’s manual, and set each tyre to that figure.' },
        { type: 'p', text: 'A quick check once a month, and again when the weather changes noticeably, takes about five minutes and is one of the cheapest safety habits there is.' }
      ],
      likes: 86,
      liked: false,
      bookmarked: false,
      comments: [
        { id: 1101, author: 'Brian O.', time: '1d ago', text: 'Never knew the sidewall number was the maximum. Checking mine tonight.', verified: true }
      ]
    },
    {
      id: 12,
      kind: 'fact',
      title: 'Why your imported car has the wheel on the right',
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'Did you know',
      date: 'Garage notes',
      readTime: '2 min read',
      tags: ['Imports', 'Kenya', 'Japan', 'UK'],
      excerpt: 'Kenya drives on the left, which is why most imported cars are right-hand drive models from markets like Japan and the UK.',
      imageUrl: IMG.e,
      imageCaption: 'Right-hand drive puts the driver next to the centre of the road.',
      imageCredit: CREDIT,
      body: [
        { type: 'p', text: 'Kenya drives on the left, which is why most imported cars are right-hand drive models from markets like Japan and the UK. Both of those countries also drive on the left, so their cars are built for the same traffic Kenyan drivers face.' },
        { type: 'p', text: 'With the steering wheel on the right, the driver sits closest to the middle of the road. That gives a clear view of oncoming traffic when overtaking, and it keeps the driver away from the kerb side of the car.' },
        { type: 'img', url: IMG.c, caption: 'Used imports reach Kenya mostly from left-driving markets.', credit: CREDIT, wide: true },
        { type: 'p', text: 'It is also why a car from a left-hand drive market is a harder fit. The pedals, mirrors and even the headlight pattern are arranged for the other side of the road.' },
        { type: 'quote', text: 'Buy the car that was built for the road you drive on.' },
        { type: 'p', text: 'If you are importing, check that the car is right-hand drive and ask for the full history. A good dealer will tell you where it came from and what has been done to it.' }
      ],
      likes: 142,
      liked: false,
      bookmarked: false,
      comments: []
    },
    {
      id: 13,
      kind: 'fact',
      title: 'What wheel alignment does for your tyres',
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'Did you know',
      date: 'Garage notes',
      readTime: '2 min read',
      tags: ['Alignment', 'Tyres', 'Steering'],
      excerpt: 'Regular wheel alignment helps tyres wear evenly and can extend their life.',
      imageUrl: IMG.b,
      imageCaption: 'Alignment sets the angle at which each wheel meets the road.',
      imageCredit: CREDIT,
      body: [
        { type: 'p', text: 'Regular wheel alignment helps tyres wear evenly and can extend their life. Alignment is the set of angles that decides how each wheel points relative to the car and the road.' },
        { type: 'p', text: 'When those angles drift, a tyre is dragged slightly sideways as it rolls. You will not feel it at first, but the tread wears unevenly, often on one edge, and the tyre needs replacing sooner than it should.' },
        { type: 'img', url: IMG.d, caption: 'Uneven wear is the most visible sign of poor alignment.', credit: CREDIT },
        { type: 'p', text: 'Common signs are the car pulling to one side, a steering wheel that sits off-centre when you drive straight, and tyres wearing more on one edge than the other.' },
        { type: 'quote', text: 'Potholes and kerbs are the usual culprits.' },
        { type: 'p', text: 'It is worth having the alignment checked after fitting new tyres, after a hard knock, and whenever the car starts to pull.' }
      ],
      likes: 64,
      liked: false,
      bookmarked: false,
      comments: []
    },
    {
      id: 14,
      kind: 'fact',
      title: 'The cheapest insurance for your engine',
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'Did you know',
      date: 'Garage notes',
      readTime: '2 min read',
      tags: ['Engine', 'Oil', 'Service'],
      excerpt: 'Changing your engine oil on schedule is one of the cheapest ways to keep an engine healthy for longer.',
      imageUrl: IMG.c,
      imageCaption: 'Clean oil keeps moving parts from wearing against each other.',
      imageCredit: CREDIT,
      body: [
        { type: 'p', text: 'Changing your engine oil on schedule is one of the cheapest ways to keep an engine healthy for longer. Oil lubricates the moving parts, carries heat away and holds tiny particles in suspension until the filter catches them.' },
        { type: 'p', text: 'Over time oil breaks down and fills with dirt. Old oil protects less, and the engine works harder and wears faster as a result.' },
        { type: 'img', url: IMG.e, caption: 'A regular service costs far less than an engine repair.', credit: CREDIT, wide: true },
        { type: 'quote', text: 'Follow the interval in your owner’s manual, not a guess.' },
        { type: 'p', text: 'The right interval depends on the engine, the type of oil and how you drive. Short trips and heavy traffic are harder on oil than steady highway driving, so a car used mostly in town may need it changed sooner.' },
        { type: 'p', text: 'Change the oil filter at the same time, and keep the receipts. A clear service history also helps when you sell or trade in the car.' }
      ],
      likes: 98,
      liked: false,
      bookmarked: false,
      comments: []
    },
    {
      id: 15,
      kind: 'fact',
      title: 'How long a car battery really lasts',
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'Did you know',
      date: 'Garage notes',
      readTime: '2 min read',
      tags: ['Battery', 'Heat', 'Electrics'],
      excerpt: 'A car’s battery typically lasts three to five years, and heat shortens that more than cold does.',
      imageUrl: IMG.a,
      imageCaption: 'Heat does more long-term damage to a battery than cold.',
      imageCredit: CREDIT,
      body: [
        { type: 'p', text: 'A car’s battery typically lasts three to five years, and heat shortens that more than cold does. Cold makes a battery feel weak on a cold morning, but heat quietly damages it from the inside.' },
        { type: 'p', text: 'High temperatures speed up the chemical wear inside the battery, so one that lives in a hot engine bay or a car parked in the sun usually ages faster than one in a cooler place.' },
        { type: 'img', url: IMG.b, caption: 'Slow starts and dim lights are early warnings.', credit: CREDIT },
        { type: 'quote', text: 'Test it before it fails, not after.' },
        { type: 'p', text: 'Signs of a tired battery include slow engine cranking, dim headlights at idle and a warning light on the dashboard. Many garages will test a battery for free in a few minutes.' },
        { type: 'p', text: 'Keep the terminals clean and tight, and if the car sits unused for weeks, start it or drive it regularly so the battery stays charged.' }
      ],
      likes: 77,
      liked: false,
      bookmarked: false,
      comments: []
    }
  ];

  /* ---------- Blog posts (feed) ---------- */

  blogs: BlogPost[] = [
    {
      id: 1,
      kind: 'blog',
      title: 'Car culture is shifting into high gear',
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'Culture',
      date: 'Today',
      readTime: '3 min read',
      tags: ['Electric', 'Manual', 'Dream cars'],
      excerpt: "Car culture is shifting into high gear! From sleek electric crossovers delivering instant torque to timeless manual sports cars keeping the pure driving spirit alive, there's never been a more exciting time to be behind the wheel.",
      imageUrl: IMG.a,
      imageCaption: 'The new generation of performance cars is quicker and quieter than ever.',
      imageCredit: CREDIT,
      body: [
        { type: 'p', text: "Car culture is shifting into high gear! From sleek electric crossovers delivering instant torque to timeless manual sports cars keeping the pure driving spirit alive, there's never been a more exciting time to be behind the wheel." },
        { type: 'p', text: 'Electric drivetrains have changed what quick means. A modern crossover can leave a traffic light faster than sports cars that once defined the category, and it does it in near silence. For daily driving in the city, that smoothness is hard to argue with.' },
        { type: 'img', url: IMG.e, caption: 'Modern lines and instant torque have changed the daily drive.', credit: CREDIT, wide: true },
        { type: 'quote', text: "There's never been a more exciting time to be behind the wheel." },
        { type: 'p', text: 'At the same time, a quiet movement is protecting the manual gearbox. Drivers who want to feel every shift, to be the one who decides when the engine sings, are keeping a three-pedal layout alive on the used market, and prices for clean examples keep rising.' },
        { type: 'img', url: IMG.d, caption: 'The manual sports car, kept alive by drivers who want to shift for themselves.', credit: CREDIT },
        { type: 'p', text: 'What is your ultimate dream ride? Drop your favorite pick in the replies below!' }
      ],
      likes: 1240,
      liked: false,
      bookmarked: false,
      comments: [
        { id: 101, author: 'Marcus V.', time: '2h ago', text: 'Jaguar E-Type Lightweight forever! Nothing beats that British racing green curve.', verified: true },
        { id: 102, author: 'Sarah Jenkins', time: '45m ago', text: 'Give me a classic Porsche 911 Singer restomod any day of the week!', verified: true }
      ]
    },
    {
      id: 2,
      kind: 'blog',
      title: 'The patience of a proper restoration',
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'Restoration',
      date: '2 days ago',
      readTime: '4 min read',
      tags: ['Classic', 'Restomod', 'Workshop'],
      excerpt: 'Restoring British racing green icons requires meticulous attention to original factory specifications. Every bolt, wire harness, and aluminum panel tells a story of decades past.',
      imageUrl: IMG.b,
      imageCaption: 'British racing green, restored to the factory specification.',
      imageCredit: CREDIT,
      body: [
        { type: 'p', text: 'Restoring British racing green icons requires meticulous attention to original factory specifications. Every bolt, wire harness, and aluminum panel tells a story of decades past.' },
        { type: 'p', text: 'A faithful restoration starts long before any paint is chosen. It begins with documentation: build sheets, chassis numbers, period photographs. Each one tells the workshop what the car left the factory with, and what should go back on it.' },
        { type: 'img', url: IMG.c, caption: 'Original panels and original proportions are what a purist protects.', credit: CREDIT, wide: true },
        { type: 'quote', text: 'Neither path is wrong, but each asks for a different kind of patience.' },
        { type: 'p', text: 'Restomods take the opposite view. Upgraded suspension, fuel injection and modern brakes make an old car easier to live with, but they also move it away from the object it once was.' },
        { type: 'img', url: IMG.a, caption: 'The modern counterpoint: comfort and performance with none of the compromises.', credit: CREDIT },
        { type: 'p', text: 'Are you a purist when it comes to classic restorations, or do you prefer modern restomods?' }
      ],
      likes: 3420,
      liked: true,
      bookmarked: true,
      comments: [
        { id: 201, author: 'David K.', time: '1d ago', text: 'Purist all the way! Keep the original matching numbers intact.', verified: true }
      ]
    },
    {
      id: 3,
      kind: 'blog',
      title: 'Why the V12 still matters',
      author: 'A-plus Motors LTD',
      handle: '@A-plus motors',
      category: 'Engines',
      date: '1 week ago',
      readTime: '3 min read',
      tags: ['V12', 'Road trips', 'Sound'],
      excerpt: 'The sound of a naturally aspirated V12 echoing through mountain passes is a symphony that never gets old. Modern turbocharging is efficient, but nothing replaces raw mechanical acoustics.',
      imageUrl: IMG.c,
      imageCaption: 'Built for long, open roads.',
      imageCredit: CREDIT,
      body: [
        { type: 'p', text: 'The sound of a naturally aspirated V12 echoing through mountain passes is a symphony that never gets old. Modern turbocharging is efficient, but nothing replaces raw mechanical acoustics.' },
        { type: 'p', text: 'Twelve cylinders firing in sequence give an engine a smoothness and a note that smaller units struggle to copy. It is not about outright speed. It is about how the car feels at six thousand revolutions on an empty road.' },
        { type: 'img', url: IMG.d, caption: 'Mechanical, honest, and loud in the best way.', credit: CREDIT, wide: true },
        { type: 'quote', text: 'The throttle and the car are connected with no delay between them.' },
        { type: 'p', text: 'Turbo engines make power with less fuel, and that matters. But for many owners the appeal of a big naturally aspirated engine is the response.' },
        { type: 'img', url: IMG.e, caption: 'Turbocharged efficiency, for comparison.', credit: CREDIT },
        { type: 'p', text: 'What mountain pass or coastal highway is at the very top of your bucket list?' }
      ],
      likes: 890,
      liked: false,
      bookmarked: false,
      comments: [
        { id: 301, author: 'Elena Rostova', time: '3d ago', text: 'Stelvio Pass in Italy! Absolute bucket list perfection.', verified: true }
      ]
    }
  ];

  private applyFilter(list: BlogPost[]): BlogPost[] {
    if (this.currentFilter === 'bookmarked') {
      return list.filter(b => b.bookmarked);
    }
    if (this.currentFilter === 'popular') {
      return [...list].sort((a, b) => b.likes - a.likes);
    }
    return list;
  }

  get filteredBlogs(): BlogPost[] {
    return this.applyFilter(this.blogs);
  }

  get filteredFacts(): BlogPost[] {
    return this.applyFilter(this.facts);
  }

  setMainTab(tab: 'blogs' | 'store' | 'home'): void {
    this.currentMainTab = tab;
  }

  setFilter(filter: 'latest' | 'popular' | 'bookmarked' | 'all'): void {
    if (this.currentFilter === filter) return;

    this.currentFilter = filter;
    this.cdr.detectChanges();

    const els = this.allPostEls();
    if (els.length > 0) {
      gsap.killTweensOf(els);
      gsap.set(els, { clearProps: 'opacity,transform' });
      this.animateBlogsIn();
    }
  }

  /* ---------- Modal ---------- */

  openBlog(post: BlogPost, scrollToReplies = false): void {
    this.pickSideInformations();
    this.selectedBlog = post;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();

    const root = this.host.nativeElement;
    const panel = root.querySelector('.modal-panel');
    const backdrop = root.querySelector('.modal-backdrop') as HTMLElement | null;
    if (backdrop) backdrop.scrollTop = 0;
    if (panel) {
      gsap.fromTo(panel, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,transform' });
    }

    const sideInfos = root.querySelectorAll('.modal-rail .side-info');
    if (sideInfos.length) {
      gsap.fromTo(
        sideInfos,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.15, stagger: 0.15, ease: 'power2.out', clearProps: 'opacity,transform' }
      );
    }

    if (scrollToReplies) {
      const target = root.querySelector('#replies');
      if (target) target.scrollIntoView({ block: 'start' });
    }
  }

  @HostListener('document:keydown.escape')
  closeBlog(): void {
    if (!this.selectedBlog) return;
    this.selectedBlog = null;
    document.body.style.overflow = '';
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeBlog();
    }
  }

  /** Up to two other posts of the same kind, shown at the bottom of the modal. */
  relatedPosts(post: BlogPost): BlogPost[] {
    const pool = post.kind === 'fact' ? this.facts : this.blogs;
    return pool.filter(p => p.id !== post.id).slice(0, 2);
  }

  /* ---------- Actions ---------- */

  private findPost(id: number): BlogPost | undefined {
    return this.blogs.find(b => b.id === id) || this.facts.find(f => f.id === id);
  }

  toggleLike(id: number): void {
    const post = this.findPost(id);
    if (post) {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      this.showToast(post.liked ? 'Added to liked posts' : 'Removed from liked posts');
    }
  }

  toggleBookmark(id: number): void {
    const post = this.findPost(id);
    if (post) {
      post.bookmarked = !post.bookmarked;
      this.showToast(post.bookmarked ? 'Blog bookmarked' : 'Bookmark removed');
    }
  }

  shareBlog(post: BlogPost): void {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Link copied to clipboard!');
    }
  }

  addComment(postId: number, event: Event): void {
    event.preventDefault();
    if (!this.isVerifiedCustomer) {
      this.showToast('Only verified customers can reply');
      return;
    }
    const form = event.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;

    const post = this.findPost(postId);
    if (post) {
      post.comments.unshift({
        id: Date.now(),
        author: 'You',
        time: 'Just now',
        text: text,
        verified: true
      });
      input.value = '';
      this.showToast('Comment posted!');
    }
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
      }
    }, 3000);
  }
}