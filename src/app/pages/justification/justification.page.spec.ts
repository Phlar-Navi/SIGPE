import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JustificationPage } from './justification.page';

describe('JustificationPage', () => {
  let component: JustificationPage;
  let fixture: ComponentFixture<JustificationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(JustificationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
