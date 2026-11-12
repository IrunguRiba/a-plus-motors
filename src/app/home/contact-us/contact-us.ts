import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Nav2 } from '../nav-2/nav-2';
import {
  ContactCategory,
  ContactFormPayload,
  ContactFormValue
} from '../../interfaces/car-interface';

/** Strongly-typed form model that mirrors ContactFormValue. */
type ContactFormGroup = FormGroup<{
  [K in keyof ContactFormValue]: FormControl<ContactFormValue[K]>;
}>;

@Component({
  selector: 'app-contact',
  templateUrl: './contact-us.html',
  imports: [CommonModule, ReactiveFormsModule, Nav2],
  styleUrls: ['./contact-us.css']
})
export class ContactUs implements OnInit, AfterViewInit {

  /** All categories allowed by the ContactCategory type. */
  readonly categories: ContactCategory[] = [
    'REQUEST',
    'COMMENT',
    'COMPLAINT',
    'FEEDBACK',
    'FINANCE',
    'SERVICE',
    'OTHER',
    'ETC'
  ];

  selectedCategory: ContactCategory = 'REQUEST';
  contactForm!: ContactFormGroup;

  @ViewChild('contactDetails', { static: false }) contactDetails!: ElementRef;
  @ViewChild('messageForm', { static: false }) messageForm!: ElementRef;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // Typed reactive form matching ContactFormValue (no category field)
    this.contactForm = this.fb.nonNullable.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    // Slide-in animation for contact details and message form only
    if (this.contactDetails && this.messageForm) {
      gsap.fromTo(
        [this.contactDetails.nativeElement, this.messageForm.nativeElement],
        {
          opacity: 0,
          y: 30
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out',
          clearProps: 'transform'
        }
      );
    }
  }

  selectCategory(category: ContactCategory): void {
    if (this.categories.includes(category)) {
      this.selectedCategory = category;
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goToFinance(): void {
    this.router.navigate(['/financing']);
  }

  goToBlogs(): void {
    this.router.navigate(['/blogs']);
  }

  goToStore(): void {
    this.router.navigate(['/store']);
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const value: ContactFormValue = this.contactForm.getRawValue();

    const submissionData: ContactFormPayload = {
      category: this.selectedCategory,
      name: value.name.trim(),
      email: value.email.trim(),
      message: value.message.trim()
    };

    console.log('Form Submitted:', submissionData);

    // Reset form without altering the URL or refreshing
    this.contactForm.reset();
    this.selectedCategory = 'REQUEST';
    alert('Message sent successfully');
  }
}