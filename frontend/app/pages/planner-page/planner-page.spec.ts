import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PlannerPage } from './planner-page';

describe('PlannerPage', () => {
  let component: PlannerPage;
  let fixture: ComponentFixture<PlannerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlannerPage, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlannerPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
