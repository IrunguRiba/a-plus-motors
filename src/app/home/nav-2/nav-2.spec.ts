import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nav2 } from './nav-2';

describe('Nav2', () => {
  let component: Nav2;
  let fixture: ComponentFixture<Nav2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nav2],
    }).compileComponents();

    fixture = TestBed.createComponent(Nav2);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
