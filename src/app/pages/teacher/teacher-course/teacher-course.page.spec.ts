import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeacherCoursePage } from './teacher-course.page';

describe('TeacherCoursePage', () => {
  let component: TeacherCoursePage;
  let fixture: ComponentFixture<TeacherCoursePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeacherCoursePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
