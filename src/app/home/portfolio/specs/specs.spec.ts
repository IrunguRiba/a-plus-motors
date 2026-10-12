import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Specs } from './specs';

describe('Specs', () => {
  let component: Specs;
  let fixture: ComponentFixture<Specs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Specs],
    }).compileComponents();

    fixture = TestBed.createComponent(Specs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
