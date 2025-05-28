import { TestBed } from '@angular/core/testing';

import { SessionEventService } from './session-event.service';

describe('SessionEventService', () => {
  let service: SessionEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
