import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe} from '@angular/common';
import { ReporteCitasService } from '../../service/reporte-service.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';


@Component({
  selector: 'app-reporte-component',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatPaginatorModule, MatDatepickerModule, MatNativeDateModule,
    ReactiveFormsModule, MatTabsModule],
  providers: [DatePipe],
  templateUrl: './reporte-component.component.html',
  styleUrls: ['./reporte-component.component.css']
})
export class ReportePrimeraInfanciaComponent implements OnInit {

  datos: any[] = [];
  columnas: string[] = [];
  pageSize: number = 10;
  pageNumber: number = 0;
  totalItems: number = 0;
  cargado: boolean = false;
  descargando: boolean = false;

  datosOriginales: any[] = []; // Copia completa de los datos para el filtro
  isFiltering: boolean = false; // Indica si el usuario está filtrando
  form: any;

  @ViewChild('tabGroup') tabGroup!: MatTabGroup;

  private reporteCitasService = inject(ReporteCitasService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  constructor(){}
  

  ngOnInit(): void {
    this.cargarCitas();
    this.form = new FormGroup({
      startDate: new FormControl(),
      endDate: new FormControl()
    });

  }

  search() {
    if (this.tabGroup.selectedIndex === 0) {
      const startDate: Date = this.form.value['startDate'];
      const endDate: Date = this.form.value['endDate'];
      console.log('Fechas seleccionadas:', startDate, endDate);
  
      if (!startDate || !endDate) {
        this.snackBar.open('Por favor selecciona ambas fechas.', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        return;
      }
  
      const date1 = this.datePipe.transform(startDate, "yyyy-MM-dd");
      const date2 = this.datePipe.transform(endDate, "yyyy-MM-dd");
  
      if (date1 && date2) {
        // Aquí puedes agregar el console.log para ver la URL
        console.log(`URL que se enviará al backend: http://localhost:8080/api/reportes/citas/fechas?fechaInicio=${date1}&fechaFin=${date2}`);

    
        this.reporteCitasService.searchDates(date1, date2).subscribe({
          next: (data) => {
            console.log('Datos recibidos del backend:', data); // 👈 Aquí imprimes los datos
            this.createTable(data);
          },
          error: (err) => {
            console.error('Error al buscar por fechas:', err);
            this.snackBar.open('Error al filtrar las fechas.', 'Cerrar', {
              duration: 3000
            });
          }
        });
        
      }
    }
  }
  
createTable(data: any) {
    console.log('Respuesta del backend:', data);
    console.log('Array de datos:', data?.data);
    console.log('Es arreglo:', Array.isArray(data?.data));
    console.log('Cantidad de registros:', data?.data?.length);
    
    const registros = Array.isArray(data) ? data : [];
  
    if (registros.length > 0) {
      this.datos = [...registros];
      this.columnas = Object.keys(this.datos[0]);
      this.totalItems = this.datos.length;
      this.cargado = true;
    } else {
      this.datos = [];
      this.snackBar.open('No se encontraron resultados para esas fechas.', 'Cerrar', {
        duration: 3000
      });
    }
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

  descargarArchivoExcel(event: Event): void {
    event.preventDefault(); // Evita que el enlace recargue la página
  
    const inicio = Date.now(); // Marcar tiempo de inicio
  
    const snackRef = this.snackBar.open('Descargando reporte...', 'Cerrar', {
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  
    this.reporteCitasService.descargarExcel().subscribe({
      next: (blob) => {
        const fin = Date.now(); // Marcar tiempo de fin
        const tiempo = (fin - inicio) / 1000; // Tiempo en segundos
  
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-citas.xlsx';
        a.click();
        URL.revokeObjectURL(url);
  
        snackRef.dismiss();
        this.snackBar.open(`Descarga completada en ${tiempo.toFixed(2)} segundos.`, 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
      error: (err) => {
        snackRef.dismiss();
        this.snackBar.open('Error al descargar el reporte.', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        console.error('Error al descargar el Excel:', err);
      }
    });
  }

  

}  