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
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';



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
    MatAutocompleteModule,
    MatMenuModule,
    FormsModule
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

  formValido: boolean = false;

  isLoading = false;

  sucursales: Sucursal[] = [];
  servicios: Servicio[] = [];
  serviciosFiltrados: Servicio[] = [];

  selectedIdCita: number | null = null;

  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  @ViewChild('paginator') paginator: any;

  private reporteCitasService = inject(ReporteCitasService);
  private sucursalService = inject(SucursalService);
  private serviciosService = inject(ServiciosService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);
  mostrarLeyenda: any;

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
      cup: new FormControl(),
      estadoCita: new FormControl()
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

    // 🔹 Actualizar estado del botón Buscar
    this.form.valueChanges.subscribe(() => {
      this.formValido = !this.isFormEmpty();
    });
    //  para que el estado inicial del botón sea correcto.
    this.form.updateValueAndValidity();
    this.formValido = !this.isFormEmpty();

  }

  isFormEmpty(): boolean {
    const values = this.form.value;

    return Object.values(values).every(value => {
      if (value === null || value === undefined || value === '') return true;

      if (typeof value === 'object') {
        // Si es una fecha (Date) o similar, se considera válido si no es null
        if (value instanceof Date) return false;

        // Si es objeto tipo Servicio o Sucursal
        return Object.values(value).every(v => v === null || v === '');
      }

      return false;
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
      cup,
      estadoCita
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
      cup,
      estadoCita
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
      cup,
      estadoCita
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
      cup,
      estadoCita
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

  getColorByEstado(estado: string): string {
    switch (estado) {
      case 'Agendada': return '#1565c0';
      case 'Cancelada': return '#b00020';
      case 'Cancelada facturador': return '#7a1820';
      case 'No cumplida': return '#c27c00';
      case 'Abierta': return '#5bff5b';
      case 'Cerrada': return '#545454';
      case 'Liquidada': return '#136a8a';
      case 'Agrupada': return '#b38f00';
      case 'Reagendada': return '#5a35bf';
      case 'Reabierta': return '#1f937d';
      default: return 'transparent';
    }
  }



  // Lógica para alternar visibilidad (si la necesitas)
  toggleLeyenda() {
    this.mostrarLeyenda = !this.mostrarLeyenda;
  }

  estados = [
    { clase: 'agendada', nombre: 'Agendada' },
    { clase: 'cancelada', nombre: 'Cancelada' },
    { clase: 'cancelada-facturador', nombre: 'Cancelada facturador' },
    { clase: 'no-cumplida', nombre: 'No cumplida' },
    { clase: 'abierta', nombre: 'Abierta' },
    { clase: 'cerrada', nombre: 'Cerrada' },
    { clase: 'liquidada', nombre: 'Liquidada' },
    { clase: 'agrupada', nombre: 'Agrupada' },
    { clase: 'reagendada', nombre: 'Reagendada' },
    { clase: 'reabierta', nombre: 'Reabierta' }
  ];


  // Puedes usar solo números o agregar descripciones si lo prefieres
  estadosCita: { valor: number, descripcion: string }[] = [
    { valor: 1, descripcion: 'Agendada' },
    { valor: 2, descripcion: 'Cancelada' },
    { valor: 3, descripcion: 'Cancelada' },
    { valor: 4, descripcion: 'No cumplida' },
    { valor: 5, descripcion: 'Abierta' },
    { valor: 6, descripcion: 'Cerrada' },
    { valor: 7, descripcion: 'Liquidada' },
    { valor: 8, descripcion: 'Agrupada' },
    { valor: 9, descripcion: 'Reagendada' },
    { valor: 10, descripcion: 'Cancelada' },
    { valor: 11, descripcion: 'Cancelada' },
    { valor: 12, descripcion: 'Reabierta' }
  ];


  onFilaClick(idCita: number) {
    if (this.selectedIdCita === idCita) {
      this.selectedIdCita = null; // Desactivar selección si clickeas de nuevo la misma
    } else {
      this.selectedIdCita = idCita;
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
