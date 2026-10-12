import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

export type ConsentChoice = 'accepted' | 'rejected';

@Component({
  selector: 'app-cookies',
  imports: [],
  templateUrl: './cookies.html',
  styleUrl: './cookies.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cookies {
  @Output() consentGiven = new EventEmitter<ConsentChoice>();

  constructor(private router: Router) {}

  onConsent(choice: ConsentChoice): void {
    this.consentGiven.emit(choice);
  }

  goToPrivacyPolicy(): void {
    this.router.navigate(['/privacy-policy']);
  }
}