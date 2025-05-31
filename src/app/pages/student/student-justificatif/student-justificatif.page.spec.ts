import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentJustificatifPage } from './student-justificatif.page';

describe('StudentJustificatifPage', () => {
  let component: StudentJustificatifPage;
  let fixture: ComponentFixture<StudentJustificatifPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentJustificatifPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
