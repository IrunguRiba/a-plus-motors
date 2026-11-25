import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
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

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  visible = true;
  private privacyTab: Window | null = null;

  onConsent(choice: ConsentChoice): void {
    this.visible = false;
    this.consentGiven.emit(choice);
    this.cdr.markForCheck();
  }

  openPrivacyPolicy(event: Event): void {
    event.preventDefault();

    if (this.privacyTab && !this.privacyTab.closed) {
      this.privacyTab.focus();
      return;
    }

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/privacy'])
    );
    this.privacyTab = window.open(url, 'aplus_privacy_policy');
  }
}