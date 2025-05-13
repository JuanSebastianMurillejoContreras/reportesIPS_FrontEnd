import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReporteCitasService } from '../../service/reporte-service.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';


@Component({
  selector: 'app-reporte-component',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatTabsModule
  ],
  providers: [DatePipe],
  templateUrl: './reporte-component.component.html',
  styleUrls: ['./reporte-component.component.css']
})
export class ReportePrimeraInfanciaComponent implements OnInit {

  pageNumber: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;

  startDateSeleccionada!: string;
  endDateSeleccionada!: string;

  datos: any[] = [];
  columnas: string[] = [];
  cargado: boolean = false;

  isFiltering: boolean = false;
  form!: FormGroup;

  isLoading = false;

  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  @ViewChild('paginator') paginator: any; // <-- Aseguramos que el paginator esté referenciado.

  private reporteCitasService = inject(ReporteCitasService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  ngOnInit(): void {
    this.form = new FormGroup({
    startDate: new FormControl(),
    endDate: new FormControl(),
    idCita: new FormControl(),
    identificacion: new FormControl(),
    nombrePaciente: new FormControl(),
    nombreMedico: new FormControl(),
    cup: new FormControl()
  });
  }

  // Método de búsqueda para filtrar por fechas

  onSubmit(): void {
    this.search(true); // siempre reinicia la paginación al buscar
  }

  limpiarFormulario(): void {
  this.form.reset();

  this.pageNumber = 0;
  this.totalItems = 0;
  this.datos = [];
  this.columnas = [];
  this.cargado = false;
  this.startDateSeleccionada = '';
  this.endDateSeleccionada = '';

  if (this.paginator) {
    this.paginator.pageIndex = 0;
    this.paginator.length = 0;
  }

  this.snackBar.open('Formulario y resultados limpiados.', 'Cerrar', {
    duration: 3000,
    horizontalPosition: 'right',
    verticalPosition: 'top'
  });
}



  search(reiniciarPagina: boolean = false): void {
  if (this.isLoading) return;
  this.isLoading = true;

  const {
    startDate,
    endDate,
    idCita,
    identificacion,
    nombrePaciente,
    medico,
    cup
  } = this.form.value;

  if (!startDate || !endDate) {
    this.snackBar.open('Por favor selecciona ambas fechas.', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
    this.isLoading = false;
    return;
  }

  const fechaInicio = this.datePipe.transform(startDate, "yyyy-MM-dd")!;
  const fechaFin = this.datePipe.transform(endDate, "yyyy-MM-dd")!;

  this.startDateSeleccionada = fechaInicio;
  this.endDateSeleccionada = fechaFin;

  if (reiniciarPagina) {
    this.pageNumber = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
  }

  const limit = this.pageSize;
  const offset = this.pageNumber * this.pageSize;

  this.reporteCitasService.searchDates(
    fechaInicio,
    fechaFin,
    limit,
    offset,
    idCita,
    identificacion,
    nombrePaciente,
    medico,
    cup
  ).subscribe({
    next: (data) => {
      this.createTable(data);
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error en búsqueda:', err);
      this.snackBar.open('Error al filtrar.', 'Cerrar', { duration: 3000 });
      this.isLoading = false;
    }
  });
}

 cambiarPagina(event: PageEvent): void {
  const nuevoOffset = event.pageIndex * event.pageSize;

  if (nuevoOffset >= this.totalItems) {
    this.snackBar.open('Ya no hay más resultados.', 'Cerrar', { duration: 3000 });
    return;
  }

  this.pageNumber = event.pageIndex;
  this.pageSize = event.pageSize;

  const {
    idCita,
    identificacion,
    nombrePaciente,
    medico,
    cup
  } = this.form.value;

  const fechaInicio = this.startDateSeleccionada;
  const fechaFin = this.endDateSeleccionada;

  this.reporteCitasService.searchDates(
    fechaInicio,
    fechaFin,
    this.pageSize,
    this.pageNumber * this.pageSize,
    idCita,
    identificacion,
    nombrePaciente,
    medico,
    cup
  ).subscribe({
    next: (data) => {
      this.createTable(data);
    },
    error: (err) => {
      console.error('Error al cambiar de página:', err);
      this.snackBar.open('Error al cargar la nueva página.', 'Cerrar', { duration: 3000 });
    }
  });
}


  createTable(data: any): void {
    console.log('createTable recibe:', data);

    // Asegúrate de que los datos sean un array válido
    const registros = Array.isArray(data?.data) ? data.data : [];

    if (registros.length === 0) {
      this.datos = []; // Limpiar la tabla si no hay datos
    } else {
      this.datos = registros; // Solo los registros de la página actual
    }

    this.totalItems = data?.total || 0;
    this.columnas = registros.length > 0 ? Object.keys(registros[0]) : [];

    if (this.paginator) {
      this.paginator.length = this.totalItems; // Total de registros
      this.paginator.pageIndex = this.pageNumber; // Página actual
    }

    this.cargado = true;

    if (registros.length === 0) {
      this.snackBar.open('No hay registros para esta página.', 'Cerrar', {
        duration: 3000
      });
    }
  }


  descargarArchivoExcel(event: Event): void {

    event.preventDefault();
    const inicio = Date.now();

    // Obtener las fechas desde el formulario
    const startDate: Date = this.form.value['startDate'];
    const endDate: Date = this.form.value['endDate'];

    if (!startDate || !endDate) {
      this.snackBar.open('Debe seleccionar un rango de fechas válido.', 'Cerrar', {
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    // Formatear las fechas a yyyy-MM-dd
    const fechaInicio = this.datePipe.transform(startDate, 'yyyy-MM-dd');
    const fechaFin = this.datePipe.transform(endDate, 'yyyy-MM-dd');

    const snackRef = this.snackBar.open('Descargando reporte...', 'Cerrar', {
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });

    this.reporteCitasService.descargarExcel(fechaInicio!, fechaFin!).subscribe({
      next: (blob) => {
        const fin = Date.now();
        const tiempo = (fin - inicio) / 1000;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-citas.xlsx';
        a.click();
        URL.revokeObjectURL(url);

        snackRef.dismiss();
        this.snackBar.open(`Descarga completada en ${tiempo.toFixed(2)} segundos.`, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
      error: (err) => {
        snackRef.dismiss();
        this.snackBar.open('Error al descargar el reporte.', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        console.error('Error al descargar el Excel:', err);
      }
    });
    console.log('Fechas para exportar:', fechaInicio, fechaFin);
  }


}
