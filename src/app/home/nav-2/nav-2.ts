import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router} from '@angular/router'

@Component({
  selector: 'app-nav-2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-2.html',
  styleUrl: './nav-2.css',
})
export class Nav2 {
  constructor(private router:Router){}
  isMenuOpen = false; 
  whatsapp = 'whatsapp.png';
  phone = 'call.png';
  youtube = 'youtube.png';
  logoImg = 'fav3.png';

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  goHome()         { this.router.navigate(['/home']) }
  goStore()        { this.router.navigate(['/store']) }
  goAbout()        { this.router.navigate(['/about-us']) }
  goFinancing()    {this.router.navigate(['/financing']) }
  goContact()      { this.router.navigate(['/contact']) }
  goSubsidiaries() { this.router.navigate(['/blogs']) }
}