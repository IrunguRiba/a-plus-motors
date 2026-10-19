import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeInImported } from './trade-in-imported';

describe('TradeInImported', () => {
  let component: TradeInImported;
  let fixture: ComponentFixture<TradeInImported>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradeInImported],
    }).compileComponents();

    fixture = TestBed.createComponent(TradeInImported);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
