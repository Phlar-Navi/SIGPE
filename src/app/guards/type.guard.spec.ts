import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { typeGuard } from './type.guard';

describe('typeGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => typeGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
