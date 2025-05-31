import { TestBed } from '@angular/core/testing';

import { JustificatifService } from './justificatif.service';

describe('JustificatifService', () => {
  let service: JustificatifService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JustificatifService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
