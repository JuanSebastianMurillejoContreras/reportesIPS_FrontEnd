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
  ) {}

  // Descargar Excel
  descargarExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/descargar`, {
      responseType: 'blob',
    });
  }

  // Enviar reporte por correo
  enviarReporte(): Observable<string> {
    return this.http.get(`${this.baseUrl}/enviar`, {
      responseType: 'text',
    });
  }

  // Obtener datos paginados
  obtenerPaginado(pageSize: number, pageNumber: number): Observable<any> {
    let params = new HttpParams()
      .set('pageSize', pageSize)
      .set('pageNumber', pageNumber);  
    return this.http.get(`${this.baseUrl}/pages`, { params });
  }

  searchDates(date1: string, date2: string, limit: number = 10000, offset: number = 0): Observable<any>{
    return this.http.get(`${this.baseUrl}/fechas?fechaInicio=${date1}&fechaFin=${date2}&limit=${limit}&offset=${offset}`);
  }
    
}
