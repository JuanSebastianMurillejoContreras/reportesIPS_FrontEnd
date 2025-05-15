import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReporteCitasService } from '../../service/reporte-service.service';
import { MaterialModule } from '../../material/material.module';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { SucursalService } from '../../service/sucursal-service.service';
import { Sucursal } from '../../model/Sucursales';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ServiciosService } from '../../service/servicios-service.service';
import { Servicio } from '../../model/Servicio';
import { map } from 'rxjs';

@Component({
  selector: 'app-reporte-component',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatIconModule,
    MatAutocompleteModule
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

  sucursales: Sucursal[] = [];
  servicios: Servicio[] = [];
  serviciosFiltrados: Servicio[] = [];

  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  @ViewChild('paginator') paginator: any;

  private reporteCitasService = inject(ReporteCitasService);
  private sucursalService = inject(SucursalService);
  private serviciosService = inject(ServiciosService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  ngOnInit(): void {
    this.cargarSucursales();
    this.cargarServicios();
    this.form = new FormGroup({
      startDate: new FormControl(),
      endDate: new FormControl(),
      sucursales: new FormControl(),
      servicios: new FormControl(),
      idCita: new FormControl(),
      numeroIdentificacion: new FormControl(),
      nombrePaciente: new FormControl(),
      nombreMedico: new FormControl(),
      codigoCup: new FormControl()
    });

    this.form.get('servicios')!.valueChanges.pipe(
      map(value => {
        if (typeof value === 'string') {
          return this.filtrarServicios(value);
        }
        return this.servicios;
      })
    ).subscribe(filtrados => {
      this.serviciosFiltrados = filtrados;
    });
  }

  displayServicio(servicio: Servicio): string {
    return servicio?.nombreServicio || '';
  }

  cargarSucursales(): void {
    this.sucursalService.getAllSucursales().subscribe({
      next: (data) => {
        this.sucursales = data;
      },
      error: (error) => {
        console.error('Error al cargar sucursales:', error);
        this.snackBar.open('No se pudieron cargar los municipios.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarServicios(): void {
    this.serviciosService.getAllServicios().subscribe({
      next: (data) => {
        this.servicios = data;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        this.snackBar.open('No se pudieron cargar los servicios.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private filtrarServicios(valor: string): Servicio[] {
    const filtro = valor.toLowerCase();
    return this.servicios.filter(servicio =>
      servicio.nombreServicio.toLowerCase().includes(filtro)
    );
  }

  onSubmit(): void {
    this.search(true);
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
      sucursales,
      servicios,
      idCita,
      numeroIdentificacion,
      nombrePaciente,
      nombreMedico,
      codigoCup
    } = this.form.value;

    const fechaInicio = startDate ? this.datePipe.transform(startDate, "yyyy-MM-dd")! : '';
    const fechaFin = endDate ? this.datePipe.transform(endDate, "yyyy-MM-dd")! : '';

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
      sucursales,
      servicios?.consecutivoServicio?.toString() || '',
      idCita,
      numeroIdentificacion,
      nombrePaciente,
      nombreMedico,
      codigoCup
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
      sucursales,
      servicios,
      idCita,
      numeroIdentificacion,
      nombrePaciente,
      nombreMedico,
      codigoCup
    } = this.form.value;

    const fechaInicio = this.startDateSeleccionada;
    const fechaFin = this.endDateSeleccionada;

    this.reporteCitasService.searchDates(
      fechaInicio,
      fechaFin,
      this.pageSize,
      this.pageNumber * this.pageSize,
      sucursales,
      servicios?.consecutivoServicio?.toString() || '',
      idCita,
      numeroIdentificacion,
      nombrePaciente,
      nombreMedico,
      codigoCup
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
    const registros = Array.isArray(data?.data) ? data.data : [];

    if (registros.length === 0) {
      this.datos = [];
    } else {
      this.datos = registros;
    }

    this.totalItems = data?.total || 0;
    this.columnas = registros.length > 0 ? Object.keys(registros[0]) : [];

    if (this.paginator) {
      this.paginator.length = this.totalItems;
      this.paginator.pageIndex = this.pageNumber;
    }

    this.cargado = true;

    if (registros.length === 0) {
      this.snackBar.open('No hay registros para esta página.', 'Cerrar', { duration: 3000 });
    }
  }

  descargarArchivoExcel(event: Event): void {
    event.preventDefault();
    const inicio = Date.now();

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
  }
}
