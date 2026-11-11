import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

export type ConsentChoice = 'accepted' | 'rejected';

@Component({
  selector: 'app-cookies',
  imports: [],
  templateUrl: './cookies.html',
  styleUrl: './cookies.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cookies implements OnDestroy {
  @Output() consentGiven = new EventEmitter<ConsentChoice>();

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  /** Whether the consent paragraph/wrapper is currently visible */
  visible = true;

  /** Whether the user has made a final decision (accepted/rejected) */
  private decided = false;

  /** Whether the banner was hidden *only* because of privacy navigation */
  private hiddenByPrivacy = false;

  private routerSub?: Subscription;

  constructor() {
    // Watch for when the privacy overlay closes
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const privacyOpen = !!this.router.parseUrl(this.router.url).root
          .children['privacy'];

        if (!privacyOpen && this.hiddenByPrivacy && !this.decided) {
          // Privacy was closed without a decision → bring the banner back
          this.visible = true;
          this.hiddenByPrivacy = false;
          this.cdr.markForCheck();
        }
      });
  }

  onConsent(choice: ConsentChoice): void {
    this.decided = true;
    this.visible = false;
    this.hiddenByPrivacy = false;
    this.consentGiven.emit(choice);
    this.cdr.markForCheck();
  }

  goToPrivacyPolicy(): void {
    if (!this.decided) {
      this.hiddenByPrivacy = true;
      this.visible = false;
      this.cdr.markForCheck();
    }
    this.router.navigate([{ outlets: { privacy: ['privacy'] } }]);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}