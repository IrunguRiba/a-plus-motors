import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Imported } from './imported/imported';
import { TradeIn } from './trade-in/trade-in';

@Component({
  selector: 'app-trade-in-imported',
  imports: [RouterLink, Imported, TradeIn],
  templateUrl: './trade-in-imported.html',
  styleUrl: './trade-in-imported.css',
})
export class TradeInImported {
  private route = inject(ActivatedRoute);

  active = toSignal(
    this.route.queryParamMap.pipe(map((p) => (p.get('tab') === 'trade-in' ? 'trade-in' : 'import'))),
    { initialValue: 'import' }
  );

  cells = [
    { label: 'Why Us', path: '/why-us', x: 3, y: 3.95 },
    { label: 'OUR STORE', path: '/our-store', x: 5.2, y: 4.2 },
    { label: '', path: null, x: 0, y: 0 },
    { label: 'FINANCING', path: '/financing', x: 1.7, y: 3.85 },
    { label: 'SUBSIDIARIES', path: '/subsidiaries', x: 2.2, y: 3.85 },
    { label: 'HOME', path: '/', x: 7, y: 3.9 },
  ];

  tabs = [
    { n: '', label: 'Import', key: 'import' },
    { n: '', label: 'Trade in', key: 'trade-in' },
  ];
}