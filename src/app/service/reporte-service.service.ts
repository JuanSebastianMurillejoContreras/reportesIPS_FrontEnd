import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReporteCitasService {

  private get baseUrl(): string {
    return `${this.apiUrl}/api/reportes/citas`;
  }

  constructor(
    private http: HttpClient,
    @Inject('API_URL') private apiUrl: string
  ) { }

  
// Descargar Excel con rango de fechas
descargarExcel(fechaInicio: string, fechaFin: string): Observable<Blob> {
  const params = new HttpParams()
    .set('fechaInicio', fechaInicio)
    .set('fechaFin', fechaFin);

  return this.http.get(`${this.baseUrl}/excel`, {
    params: params,
    responseType: 'blob',
  });
}


  // Enviar reporte por correo
  enviarReporte(): Observable<string> {
    return this.http.get(`${this.baseUrl}/enviar`, {
      responseType: 'text',
    });
  }

  
searchDates(fechaInicio: string, fechaFin: string, pageSize: number, pageNumber: number): Observable<any> {
  let params = new HttpParams()
    .set('fechaInicio', fechaInicio)
    .set('fechaFin', fechaFin)
    .set('limit', pageSize.toString()) // Se asegura que limit es un string
    .set('offset', (pageNumber * pageSize).toString()); // Offset calculado correctamente

  return this.http.get(`${this.baseUrl}/fechas`, { params });
}

}
