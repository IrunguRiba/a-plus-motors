import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Homes } from './homes';

describe('Homes', () => {
  let component: Homes;
  let fixture: ComponentFixture<Homes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Homes],
    }).compileComponents();

    fixture = TestBed.createComponent(Homes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
