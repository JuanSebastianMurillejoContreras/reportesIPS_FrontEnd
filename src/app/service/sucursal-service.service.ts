import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Sucursal } from '../model/Sucursales';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {

  private get baseUrl(): string {
    return `${this.apiUrl}/api/sucursales`;
  }

  constructor(private http: HttpClient,
    @Inject('API_URL') private apiUrl: string
  ) { }

  getAllSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(`${this.baseUrl}/getallsucursales`);
  }

}
