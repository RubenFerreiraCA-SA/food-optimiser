import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PantryPage } from './pantry-page';

describe('PantryPage', () => {
  let component: PantryPage;
  let fixture: ComponentFixture<PantryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PantryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PantryPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
