// src/app/interfaces/car-interface.ts

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
  }