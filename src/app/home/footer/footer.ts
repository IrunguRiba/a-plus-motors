import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-footer',
  imports: [],

templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  copyright='copyright.png';
  legal='insurance.png';
  constructor(private router: Router){}
  goToPrivacy():void{
    this.router.navigate(['privacy-policy']);
  }
}
