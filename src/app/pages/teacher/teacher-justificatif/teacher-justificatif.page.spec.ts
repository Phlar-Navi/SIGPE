import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeacherJustificatifPage } from './teacher-justificatif.page';

describe('TeacherJustificatifPage', () => {
  let component: TeacherJustificatifPage;
  let fixture: ComponentFixture<TeacherJustificatifPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeacherJustificatifPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
