import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteCitasService} from '../../service/reporte-service.service';
import { MatTableModule } from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-reporte-component',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatPaginatorModule],
  templateUrl: './reporte-component.component.html',
  styleUrls: ['./reporte-component.component.css']
})
export class ReporteComponent implements OnInit {
  datos: any[] = [];
  columnas: string[] = [];
  pageSize: number = 10;  
  pageNumber: number = 0; 
  totalItems: number = 0; 
  cargado: boolean = false;

  datosOriginales: any[] = []; // Copia completa de los datos para el filtro
  isFiltering: boolean = false; // Indica si el usuario está filtrando


  constructor(private reporteCitasService: ReporteCitasService) {}

  ngOnInit(): void {
    this.cargarCitas();
  }

  cargarCitas(): void {
    this.reporteCitasService.obtenerPaginado(this.pageSize, this.pageNumber).subscribe({
      next: (data) => {
        if (data && data.data && data.data.length) {
          this.datos = data.data;
          this.columnas = Object.keys(this.datos[0]);
          this.totalItems = data.totalItems; 
          this.cargado = true;
        } else {
          console.warn('No se recibieron datos.');
        }
      },
      error: (err) => {
        console.error('Error al obtener citas:', err);
      }
    });
  }

  cambiarPagina(event: PageEvent): void {
    this.pageNumber = event.pageIndex; // Índice de la página seleccionada
    this.pageSize = event.pageSize; // Tamaño de la página seleccionado
    this.cargarCitas();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
  
    // Si el filtro está vacío, restauramos los datos originales
    if (!filterValue) {
      this.cargarCitas(); // Vuelve a cargar los datos sin filtro
    } else {
      // Filtrar los datos cuando hay texto en el filtro
      this.datos = this.datos.filter(fila => {
        return Object.keys(fila).some(key => 
          fila[key] && fila[key].toString().toLowerCase().includes(filterValue)
        );
      });
    }
  }
  

}
