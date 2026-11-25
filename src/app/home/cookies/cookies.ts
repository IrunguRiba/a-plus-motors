import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export type ConsentChoice = 'accepted' | 'rejected';

@Component({
  selector: 'app-cookies',
  imports: [RouterLink],
  templateUrl: './cookies.html',
  styleUrl: './cookies.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cookies {
  @Output() consentGiven = new EventEmitter<ConsentChoice>();

  private cdr = inject(ChangeDetectorRef);
  visible = true;

  onConsent(choice: ConsentChoice): void {
    this.visible = false;
    this.consentGiven.emit(choice);
    this.cdr.markForCheck();
  }
}