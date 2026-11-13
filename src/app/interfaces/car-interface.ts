   export interface BankDetail {
    bank: string;
    fullName: string;
    logo: string;
    color: string;
  }
  
  export interface FinanceInfo {
    enabled: boolean;
    banks: string[];
    pending: number;
    active: boolean;
    bankDetails: BankDetail[];
    bankFullName?: string;
    bankLogo?: string;
    bankColor?: string;
    rate?: number;
    deposit?: number;
    term?: number;
    maxAmount?: number;
    monthly?: number;
    overrides?: {
      deposit?: number;
      rate?: number;
      term?: number;
    };
    primaryBank?: string;
  }
  
  export interface CarDocument {
    _id: string;
    label: string;
    fileName: string;
  }
  
  export interface ApiCar {
    _id: string;
    status: string;
    make: string;
    model: string;
    year: number;
    body: string;
    colour: string;
    mileage: number;
    engine: number;
    drive: string;
    transmission: string;
    fuel: string;
    vin: string;
    source: string;
    branch: string;
    cost: number;
    price: number;
    negotiable: boolean;
    financing: boolean;
    notes?: string;
    showOnWeb: boolean;
    salesperson: string;
    recommended: boolean;
    photos: string[];
    features: string[];
    availabilityStatus: string;
    banks: string[];
    finance: FinanceInfo;
    documents: CarDocument[];
    createdAt: string;
    updatedAt: string;
    stockNo: string;
    __v: number;
    reviewVideoUrl?: string;
  }
  
  export interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
  
  export interface CarsResponse {
    success: boolean;
    pagination: Pagination;
    count: number;
    cars: ApiCar[];
  }
  
  export interface StoreCar {
    id: string;
    image: string;
    year: string;
    make: string;
    name: string;
    price: string;
    oldPrice: string;
    mileage: string;
    gearbox: string;
    fuel: string;
    engine: string;
    isNew: boolean;
    deal: boolean;
    reviewVideoUrl?: string; 
  }
  
  /* ============================================================
     SPECS PAGE
     ============================================================ */
  
  /** Which gallery view is active. */
  export type CarView = 'exterior' | 'interior';
  
  /** Normalised body buckets used for "similar cars" matching. */
  export type BodyBucket =
    | 'suv'
    | 'truck'
    | 'van'
    | 'coupe'
    | 'hatchback'
    | 'sedan'
    | 'other';
  
  /** A single label/value row in a spec table. */
  export interface SpecRow {
    label: string;
    value: string;
  }
  
  /** A titled group of spec rows (e.g. "Engine & Performance"). */
  export interface SpecGroup {
    title: string;
    rows: SpecRow[];
  }
  
  /** A vehicle shown in the "similar cars" grid on the specs page. */
  export interface SimilarCar {
    id: string;
    name: string;
    brand: string;
    year: string;
    price: string;
    meta: string;
    why: string;
    image: string;
  }
  
  /** What the interest modal is enquiring about. */
  export interface InquiryTarget {
    name: string;
    price: string;
  }
  
  /** Payload submitted from the specs interest form. */
  export interface InterestFormPayload {
    name: string;
    phone: string;
    schedule: boolean;
    date: string;
    time: string;
    tradeIn: boolean;
    tradeMake: string;
    tradeYear: string;
    tradeMileage: string;
  }
  
  /* ============================================================
     FINANCING PAGE
     ============================================================ */
  
  /** Tabs available on the financing page. */
  export type FinancingTab = 'options' | 'calculator' | 'apply' | 'insurance';
  
  /** Applicant type for the loan application. */
  export type ApplyType = 'individual' | 'company';
  
  /** A parsed link to a car's specs page (?id=<carId>). */
  export interface CarLink {
    id: string;
    url: string;
  }
  
  /** Finance info attached to a specific car (used by the calculator and apply form). */
  export interface FinancingInfo {
    enabled: boolean;
    bank?: string;
    bankFullName?: string;
    bankLogo?: string;
    bankColor?: string;
    rate?: number;
    deposit?: number;
    term?: number;
    monthly?: number;
    maxAmount?: number;
  }
  
  /** Loan terms shown in the "Loan Options" tab. */
  export interface LoanTerm {
    label: string;
    value: string;
  }
  
  /** A financing partner bank. */
  export interface Bank {
    name: string;
    logo: string;
  }
  
  /** Calculator state. */
  export interface CalculatorState {
    type: 'new' | 'used';
    price: number;
    depositPct: number;
    months: number;
    rate: number;
  }
  
  /** A saved calculation that gets transferred to the Apply tab. */
  export interface CalculationFigures {
    condition: string;
    price: number;
    depositPct: number;
    deposit: number;
    loan: number;
    months: number;
    rate: number;
    monthly: number;
    notEligible?: boolean;
  }
  
  /** Individual loan application form data. */
  export interface IndividualApplication {
    name: string;
    phone: string;
    email: string;
    idNumber: string;
    employment: string;
    vehicle: string;
    amount: string;
    period: string;
  }
  
  /** Company loan application form data. */
  export interface CompanyApplication {
    company: string;
    contact: string;
    phone: string;
    email: string;
    pin: string;
    vehicle: string;
    amount: string;
    period: string;
  }
  
  /** Insurance cover type. */
  export interface CoverType {
    icon: string;
    title: string;
    text: string;
  }
  
  /** Insurance partner. */
  export interface Insurer {
    name: string;
    short: string;
    domain: string;
    wide: boolean;
  }
  
  /* ============================================================
     IMPORT PAGE
     ============================================================ */
  
  /** A single line in the landed-cost breakdown. */
  export interface ImportCostRow {
    label: string;
    value: number;
    strong?: boolean;
  }
  
  /** A step in the import process. */
  export interface ImportStep {
    n: string;
    t: string;
    d: string;
    m: string;
    thumb: string;
    video: string;
    points: string[];
  }
  
  /** A spec summary card on the import page. */
  export interface ImportSpec {
    k: string;
    v: string;
    tag: string;
  }
  
  /** FAQ entry (shared by import and trade-in pages). */
  export interface FaqItem {
    q: string;
    a: string;
  }
  
  /** Playlist item for the video lightbox. */
  export interface VideoPlaylistItem {
    video: string;
    thumb: string;
  }
  
  /** Import request form payload. */
  export interface ImportRequestPayload {
    origin: string;
    make: string;
    model: string;
    year: number;
    fuel: string;
    engine: string;
    price: number;
    name: string;
    phone: string;
    email: string;
    notes: string;
  }
  
  /** Constants for import tax calculation. */
  export const IMPORT_RATES = {
    SHIPPING_RATE: 0.075,
    IMPORT_DUTY: 0.25,
    EXCISE_DUTY: 0.2,
    VAT: 0.16,
    IDF: 0.025,
    RDL: 0.02,
  } as const;
  
  /* ============================================================
     TRADE-IN PAGE
     ============================================================ */
  
  /** Vehicle condition option. */
  export interface ConditionOption {
    name: string;
    hint: string;
  }
  
  /** An upgrade vehicle the user can trade toward. */
  export interface UpgradeVehicle {
    name: string;
    price: number;
  }
  
  /** A bookable day for inspection. */
  export interface BookingDay {
    weekday: string;
    date: string;
  }
  
  /** A step in the trade-in process. */
  export interface TradeInStep {
    n: string;
    t: string;
    d: string;
    m: string;
    thumb: string;
    video: string;
    points: string[];
  }
  
  /** A benefit card. */
  export interface Benefit {
    n: string;
    t: string;
    d: string;
  }
  
  /** A spec summary card on the trade-in page. */
  export interface TradeInSpec {
    k: string;
    v: string;
    tag: string;
  }
  
  /** Trade-in valuation payload. */
  export interface TradeInPayload {
    make: string;
    model: string;
    year: number;
    mileage: number;
    transmission: string;
    fuel: string;
    condition: string;
    photos: string[];
    upgrade: string;
    dayIndex: number;
    time: string;
    name: string;
    phone: string;
  }
  
  /** Catalogue of base prices by make → model. */
  export type TradeInCatalogue = Record<string, Record<string, number>>;
  
  /** Condition adjustments (percentage) by condition name. */
  export type ConditionAdjustments = Record<string, number>;
  
  /** Constants for trade-in valuation. */
  export const TRADE_IN_CONSTANTS = {
    REFERENCE_YEAR: 2021,
    ANNUAL_DEPRECIATION: 0.08,
    KM_PER_YEAR: 15000,
    RANGE_SPREAD: 0.0616,
  } as const;
  
  /* ============================================================
     BLOGS PAGE
     ============================================================ */
  
  /** A comment on a blog post. */
  export interface BlogComment {
    id: number;
    author: string;
    time: string;
    text: string;
    verified: boolean;
  }
  
  /** One block of story content: paragraph, pull quote, or image. */
  export interface BlogBlock {
    type: 'p' | 'quote' | 'img';
    text?: string;
    url?: string;
    caption?: string;
    credit?: string;
    wide?: boolean;
  }
  
  /** Main tab of the blogs page. */
  export type BlogMainTab = 'blogs' | 'store' | 'home';
  
  /** Feed filter. */
  export type BlogFilter = 'latest' | 'popular' | 'bookmarked' | 'all';
  
  /** A blog post or "did you know" fact. */
  export interface BlogPost {
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
    body: BlogBlock[];
    likes: number;
    liked: boolean;
    bookmarked: boolean;
    comments: BlogComment[];
  }
  
  /** Side information shown in the modal rails. */
  export interface SideInformation {
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
  
  /** Payload for posting a new comment. */
  export interface NewCommentPayload {
    postId: number;
    text: string;
  }
  
  /* ============================================================
     CONTACT PAGE
     ============================================================ */
  
  /** Contact form categories. */
  export type ContactCategory =
    | 'REQUEST'
    | 'COMMENT'
    | 'COMPLAINT'
    | 'FEEDBACK'
    | 'FINANCE'
    | 'SERVICE'
    | 'OTHER'
    | 'ETC';
  
  /** Payload submitted from the contact form. */
  export interface ContactFormPayload {
    category: ContactCategory;
    name: string;
    email: string;
    message: string;
  }
  
  /** Raw reactive form value shape (name/email/message only, no category). */
  export interface ContactFormValue {
    name: string;
    email: string;
    message: string;
  }
  
  /** Optional: shape of the backend response after a contact submission. */
  export interface ContactResponse {
    success: boolean;
    message?: string;
    id?: string;
  }