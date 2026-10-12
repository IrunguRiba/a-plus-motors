import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Specs } from './specs/specs';
import { Router } from '@angular/router';

interface Car {
  id: number;
  year: number;
  make: string;
  mileage: string;
  model: string;
  description: string;
  price: string;
  image: string;
  engineCC: string;     
  fuelType: string;    
  transmission: string;  
  monthlyFinance: string;  
}

interface Brand {
  id: number;
  name: string;
  logo: string;
}

@Component({
  selector: 'app-portfolio',
  imports: [CommonModule, Specs],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio {
  openedSpecs = false;

  constructor(private router: Router) {
    const shuffledCars = [...this.cars].sort(() => Math.random() - 0.5);
    this.displayCars = [
      ...shuffledCars,
      ...shuffledCars
    ];

    this.displayBrands = [
      ...this.brands,
    ];
  }

  openSpecs() {
    this.openedSpecs = !this.openedSpecs;
    this.router.navigate(['/specs']);
  }

  cars: Car[] = [
    {
      id: 1,
      year: 2019,
      make: 'B M W',
      mileage: 'Second Hand',
      model: ' i4 M50',
      description: 'With its aerodynamic curves and bold lines, this car is a standout on the road, turning heads and making a statement wherever it goes.',
      price: 'KSH 8,880,000',
      image: '3.jpg',
      engineCC: '1,998 CC',
      fuelType: 'Electric',
      transmission: 'Automatic',
      monthlyFinance: 'KSH 148,000'
    },
    {
      id: 2,
      year: 2021,
      make: 'B M W',
      mileage: 'New',
      model: ' i4 M50',
      description: 'With its aerodynamic curves and bold lines, this car is a standout on the road, turning heads and making a statement wherever it goes.',
      price: 'KSH 8,880,000',
      image: '3.jpg',
      engineCC: '1,998 CC',
      fuelType: 'Electric',
      transmission: 'Automatic',
      monthlyFinance: 'KSH 148,000'
    },
    {
      id: 3,
      year: 2022,
      make: 'B M W',
      mileage: 'New',
      model: ' i4 M50',
      description: 'With its aerodynamic curves and bold lines, this car is a standout on the road, turning heads and making a statement wherever it goes.',
      price: 'KSH 8,880,000',
      image: '3.jpg',
      engineCC: '1,998 CC',
      fuelType: 'Electric',
      transmission: 'Automatic',
      monthlyFinance: 'KSH 148,000'
    }
  ];

  storeCars: Car[] = [
    {
      id: 1,
      year: 2013,
      make: 'Audi A4',
      mileage: 'Good',
      model: 'A4',
      description: 'Clean executive vehicle.',
      price: 'Ksh 8,695,000',
      image: '3.jpg',
      engineCC: '1,984 CC',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      monthlyFinance: 'KSH 145,000'
    }
  ];

  brands: Brand[] = [
    { id: 1, name: 'Toyota', logo: 'toyota-logo-2020.png' },
    { id: 2, name: 'Subaru', logo: 'subaru-logo-2019.png' },
    { id: 3, name: 'BMW', logo: 'bmw-logo-2020-1.png' },
    { id: 4, name: 'Mercedes', logo: 'mercedes-benz-logo-2011.png' },
    { id: 5, name: 'Audi', logo: 'audi-logo-2016.png' }
  ];

  displayCars: Car[] = [];
  displayBrands: Brand[] = [];

}