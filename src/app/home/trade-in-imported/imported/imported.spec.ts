import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Imported } from './imported';

describe('Imported', () => {
  let component: Imported;
  let fixture: ComponentFixture<Imported>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Imported],
    }).compileComponents();

    fixture = TestBed.createComponent(Imported);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
