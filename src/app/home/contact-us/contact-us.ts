import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Nav2 } from '../nav-2/nav-2';

@Component({
  selector: 'app-contact',
  templateUrl: './contact-us.html',
  imports: [CommonModule, ReactiveFormsModule, Nav2],
  styleUrls: ['./contact-us.css']
})
export class ContactUs implements OnInit, AfterViewInit {
  
  selectedCategory: string = 'REQUEST';
  contactForm!: FormGroup;

  @ViewChild('contactDetails', { static: false }) contactDetails!: ElementRef;
  @ViewChild('messageForm', { static: false }) messageForm!: ElementRef;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // Initialize the Reactive Form group with validation rules
    this.contactForm = this.fb.group({
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

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
  goToFinance(){
    this.router.navigate(['/financing'])
  }
  goToBlogs(){
    this.router.navigate(['/blogs'])
  }
  goToStore():void{
    this.router.navigate(['/store'])
  }
  onSubmit(): void {
    if (this.contactForm.valid) {
      const submissionData = {
        category: this.selectedCategory,
        ...this.contactForm.value
      };
      
      console.log('Form Submitted:', submissionData);
      
      // Reset form without altering the URL or refreshing
      this.contactForm.reset();
      alert('Message sent successifully');
    } else {
      this.contactForm.markAllAsTouched();
    }
  }
}