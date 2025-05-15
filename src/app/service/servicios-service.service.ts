import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Servicio } from '../model/Servicio';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  private get baseUrl(): string {
    return `${this.apiUrl}/api/servicios`;
  }

  constructor(private http: HttpClient,
    @Inject('API_URL') private apiUrl: string) { }


  getAllServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.baseUrl}/getallservicios`);
  }
}
