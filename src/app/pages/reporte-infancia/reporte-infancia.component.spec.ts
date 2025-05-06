import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteInfanciaComponent } from './reporte-infancia.component';

describe('ReporteInfanciaComponent', () => {
  let component: ReporteInfanciaComponent;
  let fixture: ComponentFixture<ReporteInfanciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteInfanciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteInfanciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
