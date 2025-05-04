import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CicloVida } from './../../../../../model/Lifecycle';
import { CicloVidaService } from '../../../../../service/lifecycle.service';
import { HenService } from './../../../../../service/hen.service';
import { Vaccine } from './../../../../../model/Vaccine';
import { VaccineService } from './../../../../../service/vaccine.service';
import { FoodService } from './../../../../../service/food.service';
import { Food } from './../../../../../model/food';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lifecycle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lifecycle.component.html',
})
export class LifecycleComponent implements OnInit {
  ciclos: CicloVida[] = [];
  paginaCiclos: CicloVida[] = [];
  cicloSeleccionado: CicloVida | null = null;
  mostrarModal: boolean = false;
  mostrarModalDetalle: boolean = false;
  cicloDetalle: any = null;
  page: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 0;
  statusFilter: 'A' | 'I' = 'A';
  statusActive: boolean = true;
  nuevoCiclo: CicloVida = { henId: 0, typeIto: '', nameIto: '', typeTime: '', timesInWeeks: '', times: 0, status: 'A' };
  mostrarModalCrear: boolean = false;
  mostrarModalEdicion: boolean = false;
  tipoBusqueda: string = '';
  hens: any[] = [];
  vacunas: Vaccine[] = [];
  alimentos: Food[] = [];

  private vaccineSub: Subscription | undefined;
  private foodSub: Subscription | undefined;

  constructor(
    private cicloVidaService: CicloVidaService,
    private henService: HenService,
    private vacunaService: VaccineService,
    private foodService: FoodService
  ) {}

  ngOnInit(): void {
    this.listarCiclos();
    this.getHens();
  }

  ngOnDestroy(): void {
    this.vaccineSub?.unsubscribe();
    this.foodSub?.unsubscribe();
  }

  getHens() {
    this.henService.getHens().subscribe(data => {
      this.hens = data;
    });
  }

  // Método para manejar cambio de tipo de hito en el formulario de creación
  onTipoItoChange() {
    if (this.nuevoCiclo.typeIto === 'Vacunas') {
      this.cargarVacunas();
      this.alimentos = []; // Limpiar alimentos si cambia a vacunas
    } else if (this.nuevoCiclo.typeIto === 'Alimentación') {
      this.cargarAlimentos();
      this.vacunas = []; // Limpiar vacunas si cambia a alimentación
    } else {
      this.vacunas = [];
      this.alimentos = [];
    }
  }

  // Método para manejar cambio de tipo de hito en el formulario de edición
  onTipoItoChangeEdicion() {
    if (this.cicloSeleccionado && this.cicloSeleccionado.typeIto === 'Vacunas') {
      this.cargarVacunas();
      this.alimentos = []; // Limpiar alimentos si cambia a vacunas
    } else if (this.cicloSeleccionado && this.cicloSeleccionado.typeIto === 'Alimentación') {
      this.cargarAlimentos();
      this.vacunas = []; // Limpiar vacunas si cambia a alimentación
    } else {
      this.vacunas = [];
      this.alimentos = [];
    }
  }

  // Método centralizado para cargar vacunas
  cargarVacunas() {
    this.vacunaService.getAllVaccines(); // Dispara la carga
    if (this.vaccineSub) {
      this.vaccineSub.unsubscribe();
    }
    this.vaccineSub = this.vacunaService.vaccines$.subscribe(
      data => this.vacunas = data.filter(v => v.active === 'A'),  // solo activos
      error => console.error('Error al recibir vacunas', error)
    );
  }

  // Método mejorado para cargar alimentos
  cargarAlimentos() {
    if (this.foodSub) {
      this.foodSub.unsubscribe();
    }
    this.foodSub = this.foodService.getActiveFoods().subscribe(
      data => {
        this.alimentos = data;
        console.log('Alimentos cargados:', this.alimentos);
      },
      error => console.error('Error al recibir alimentos', error)
    );
  }

  abrirModalCrear(): void {
    this.mostrarModalCrear = true;
    // Pre-cargar los dropdowns de opciones
    this.onTipoItoChange();
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
    this.nuevoCiclo = { henId: 0, typeIto: '', nameIto: '', typeTime: '', timesInWeeks: '', times: 0, status: 'A' };
  }

  crearCiclo(): void {
    this.cicloVidaService.create(this.nuevoCiclo).subscribe({
      next: () => {
        this.listarCiclos();
        this.cerrarModalCrear();
      },
      error: (err) => console.error('Error al crear ciclo', err),
    });
  }

  listarCiclos(): void {
    this.cicloVidaService.getCycles().subscribe({
      next: (data) => {
        this.ciclos = data;
        this.filtrarCiclos();
      },
      error: (err) => console.error('Error al listar ciclos', err),
    });
  }

  filtrarCiclos(): void {
    const filtradas = this.ciclos.filter(ciclo => ciclo.status === this.statusFilter);
    this.totalPages = Math.ceil(filtradas.length / this.itemsPerPage);
    this.updatePaginatedData(filtradas);
  }

  updatePaginatedData(filtradas: CicloVida[]): void {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginaCiclos = filtradas.slice(startIndex, endIndex);
  }

  toggleStatus(): void {
    this.statusFilter = this.statusFilter === 'A' ? 'I' : 'A';
    this.statusActive = !this.statusActive;
    this.page = 1;
    this.filtrarCiclos();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.filtrarCiclos();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filtrarCiclos();
    }
  }

  eliminarCiclo(id: number): void {
    this.cicloVidaService.delete(id).subscribe({
      next: () => window.location.reload(),
      error: (err) => console.error('Error al eliminar el ciclo', err),
    });
  }

  verCiclo(ciclo: any) {
    console.log("Detalles del ciclo:", ciclo);
  }

  restaurarCiclo(id: number): void {
    this.cicloVidaService.activate(id).subscribe({
      next: () => window.location.reload(),
      error: (err) => console.error('Error al restaurar el ciclo', err),
    });
  }

  abrirModalDetalle(ciclo: any) {
    this.cicloDetalle = ciclo;
    this.mostrarModalDetalle = true;

    if (ciclo.henId) {
      this.henService.getHenById(ciclo.henId).subscribe((hen: any) => {
        this.cicloDetalle.arrivalDate = hen.arrivalDate;
      });
    }
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.cicloDetalle = null;
  }

  editarCiclo(ciclo: CicloVida): void {
    this.cicloSeleccionado = { ...ciclo };
    
    // Cargar las opciones correspondientes según el tipo seleccionado
    if (this.cicloSeleccionado.typeIto === 'Vacunas') {
      this.cargarVacunas();
    } else if (this.cicloSeleccionado.typeIto === 'Alimentación') {
      this.cargarAlimentos();
    }
    
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cicloSeleccionado = null;
  }

  guardarEdicion(): void {
    if (!this.cicloSeleccionado) return;

    this.cicloVidaService.update(this.cicloSeleccionado).subscribe({
      next: () => {
        this.listarCiclos();
        this.cerrarModal();
      },
      error: (err) => console.error('Error al actualizar ciclo', err)
    });
  }

  buscarCicloPorTipo(): void {
    if (!this.tipoBusqueda) {
      this.listarCiclos();
      return;
    }

    this.cicloVidaService.getCiclosByTypeIto(this.tipoBusqueda).subscribe({
      next: (data: CicloVida[]) => {
        this.ciclos = data;
        this.filtrarCiclos();
      },
      error: (err) => console.error('Error al buscar ciclos por tipo', err)
    });
  }

  toggleCiclo(id: number, status: 'A' | 'I'): void {
    if (status === 'A') {
      this.eliminarCiclo(id);
    } else {
      this.restaurarCiclo(id);
    }
  }
}