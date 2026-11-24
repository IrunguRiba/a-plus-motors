import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Nav } from '../nav/nav';
import { Imported } from './imported/imported';
import { TradeIn } from './trade-in/trade-in';

@Component({
  selector: 'app-trade-in-imported',
  imports: [RouterLink, Nav, Imported, TradeIn],
  templateUrl: './trade-in-imported.html',
  styleUrl: './trade-in-imported.css',
})
export class TradeInImported {
  private route = inject(ActivatedRoute);

  logoImg = 'fav3.png';
  isMenuOpen = false;
  searchWindowOpened = false;

  active = toSignal(
    this.route.queryParamMap.pipe(map((p) => (p.get('tab') === 'trade-in' ? 'trade-in' : 'import'))),
    { initialValue: 'import' }
  );

  tabs = [
    { n: '', label: 'Import', key: 'import' },
    { n: '', label: 'Trade in', key: 'trade-in' },
  ];

  openSearch(): void {
    this.searchWindowOpened = true;
  }

  closeSearch(event: Event): void {
    event.stopPropagation();
    this.searchWindowOpened = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}