import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { typeStudentGuard } from './type-student.guard';

describe('typeStudentGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => typeStudentGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
