import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  currentYear = new Date().getFullYear();
  copyright = 'copyright.png';
  legal = 'insurance.png';

  constructor(private router: Router) {}

  goToPrivacy(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['privacy-policy']);
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