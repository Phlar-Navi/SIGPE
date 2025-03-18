import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentCoursePage } from './student-course.page';

describe('StudentCoursePage', () => {
  let component: StudentCoursePage;
  let fixture: ComponentFixture<StudentCoursePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentCoursePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
