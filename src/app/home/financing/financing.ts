import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Nav2 } from '../nav-2/nav-2';

@Component({
  selector: 'app-financing',
  standalone: true,
  imports: [CommonModule, Nav2],
  templateUrl: './financing.html',
  styleUrl: './financing.css',
})
export class Financing {
  constructor(private router: Router) {}

  activeTab: string = 'general';

  banks1 = [
    { name: 'Equity', logo: 'equity.png' },
    { name: 'KCB', logo: 'kcb.png' },
    { name: 'Stanbic', logo: 'stanbic.png' },
    { name: 'NIC', logo: 'nic.png' },
  ];

  banks2 = [
    { name: 'Co-op', logo: 'coop.png' },
    { name: 'KWFT', logo: 'kwft.png' },
    { name: 'Family', logo: 'family.png' },
    { name: 'Unitas', logo: 'unitas.png' },
    { name: 'Spire', logo: 'spire.png' },
  ];

  individualRequirements: string[] = [
    'Complete the loan application form',
    '6 months (latest) original bank statements',
    'Copy of PIN and national ID',
    '3 months current payslips (if employed)',
    'Original KRA search certificate for used vehicles',
    'Original market valuation report'
  ];

  companyRequirements: string[] = [
    '6 months current bank statements',
    'Audited accounts for the last 3 years',
    'Copy of PIN and certificate of incorporation / registration',
    'Board resolution',
    'Memo & articles of association'
  ];

  // Switches instantly: no fade-out/fade-in, so there is no delay on click.
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  goToStore() {
    this.router.navigate(['/store']);
  }

  goHome() {
    this.router.navigate(['']);
  }
}