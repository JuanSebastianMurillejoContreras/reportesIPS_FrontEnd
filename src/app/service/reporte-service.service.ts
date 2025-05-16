import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReporteCitasService {

  private get baseUrl(): string {
    return `${this.apiUrl}/api/reportes/actividades`;
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

  
searchDates(
  fechaInicio: string | null,
  fechaFin: string | null,
  pageSize: number,
  offset: number,
  razonSocial: string,
  consecutivoServicio: string,
  idCita?: string,
  numeroIdentificacion?: string,
  nombrePaciente?: string,
  nombreMedico?: string,
  cup?: string,
  estadoCita?: number
): Observable<any> {
  let params = new HttpParams()
    .set('limit', pageSize.toString())
    .set('offset', offset.toString());

  // Solo agregar las fechas si no son nulas
  if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
  if (fechaFin) params = params.set('fechaFin', fechaFin);

  // Agregar otros parámetros si existen
  if (razonSocial) params = params.set('razonSocial', razonSocial);
  if (consecutivoServicio) params = params.set('consecutivoServicio', consecutivoServicio);
  if (idCita) params = params.set('idCita', idCita);
  if (numeroIdentificacion) params = params.set('numeroIdentificacion', numeroIdentificacion);
  if (nombrePaciente) params = params.set('nombrePaciente', nombrePaciente);
  if (nombreMedico) params = params.set('nombreMedico', nombreMedico);
  if (cup) params = params.set('cup', cup);
  if (estadoCita) params = params.set('estadoCita', estadoCita);


  return this.http.get(`${this.baseUrl}/fechas`, { params });
}


}
