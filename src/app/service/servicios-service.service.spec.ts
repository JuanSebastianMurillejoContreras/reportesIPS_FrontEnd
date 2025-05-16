import { TestBed } from '@angular/core/testing';

import { ServiciosServiceService } from './servicios-service.service';

describe('ServiciosServiceService', () => {
  let service: ServiciosServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiciosServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
