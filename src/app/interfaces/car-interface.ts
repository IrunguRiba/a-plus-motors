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

export type CarView = 'exterior' | 'interior';

export type BodyBucket =
  | 'suv'
  | 'truck'
  | 'van'
  | 'coupe'
  | 'hatchback'
  | 'sedan'
  | 'other';

export interface SpecRow {
  label: string;
  value: string;
}

export interface SpecGroup {
  title: string;
  rows: SpecRow[];
}

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

export interface InquiryTarget {
  name: string;
  price: string;
}

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

export type FinancingTab = 'options' | 'calculator' | 'apply' | 'insurance';

export type ApplyType = 'individual' | 'company';

export interface CarLink {
  id: string;
  url: string;
}

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

export interface LoanTerm {
  label: string;
  value: string;
}

export interface Bank {
  name: string;
  logo: string;
}

export interface CalculatorState {
  type: 'new' | 'used';
  price: number;
  depositPct: number;
  months: number;
  rate: number;
}

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

export interface CoverType {
  icon: string;
  title: string;
  text: string;
}

export interface Insurer {
  name: string;
  short: string;
  domain: string;
  wide: boolean;
}

export interface ImportCostRow {
  label: string;
  value: number;
  strong?: boolean;
}

export interface ImportStep {
  n: string;
  t: string;
  d: string;
  m: string;
  thumb: string;
  video: string;
  points: string[];
}

export interface ImportSpec {
  k: string;
  v: string;
  tag: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface VideoPlaylistItem {
  video: string;
  thumb: string;
}

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

export const IMPORT_RATES = {
  SHIPPING_RATE: 0.075,
  IMPORT_DUTY: 0.25,
  EXCISE_DUTY: 0.2,
  VAT: 0.16,
  IDF: 0.025,
  RDL: 0.02,
} as const;

export interface ConditionOption {
  name: string;
  hint: string;
}

export interface BookingDay {
  weekday: string;
  date: string;
}

export interface TradeInStep {
  n: string;
  t: string;
  d: string;
  m: string;
  thumb: string;
  video: string;
  points: string[];
}

export interface Benefit {
  n: string;
  t: string;
  d: string;
}

export interface TradeInSpec {
  k: string;
  v: string;
  tag: string;
}

export interface TradeInPayload {
  carId: string;
  mileage: number;
  transmission: string;
  fuel: string;
  condition: string;
  photos: string[];
  dayIndex: number;
  time: string;
  name: string;
  phone: string;
}

export type ConditionAdjustments = Record<string, number>;

export const TRADE_IN_CONSTANTS = {
  REFERENCE_YEAR: 2021,
  ANNUAL_DEPRECIATION: 0.08,
  KM_PER_YEAR: 15000,
  RANGE_SPREAD: 0.0616,
} as const;

export interface BlogComment {
  id: number;
  author: string;
  time: string;
  text: string;
  verified: boolean;
}

export interface BlogBlock {
  type: 'p' | 'quote' | 'img';
  text?: string;
  url?: string;
  caption?: string;
  credit?: string;
  wide?: boolean;
}

export type BlogMainTab = 'blogs' | 'store' | 'home';

export type BlogFilter = 'latest' | 'popular' | 'bookmarked' | 'all';

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

export interface NewCommentPayload {
  postId: number;
  text: string;
}

export type ContactCategory =
  | 'REQUEST'
  | 'COMMENT'
  | 'COMPLAINT'
  | 'FEEDBACK'
  | 'FINANCE'
  | 'SERVICE'
  | 'OTHER'
  | 'ETC';

export interface ContactFormPayload {
  category: ContactCategory;
  name: string;
  email: string;
  message: string;
}

export interface ContactFormValue {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message?: string;
  id?: string;
}