import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeIn } from './trade-in';

describe('TradeIn', () => {
  let component: TradeIn;
  let fixture: ComponentFixture<TradeIn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradeIn],
    }).compileComponents();

    fixture = TestBed.createComponent(TradeIn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
