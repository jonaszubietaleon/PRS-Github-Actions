import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import { ConsumptionService } from "../../../../../service/consumption.service";
import { FormConsumptionComponent } from "./form-consumo/form-consumption.component";

interface Consumption {
  id_consumption: number;
  date: string;
  id_home: number;
  names: string;
  quantity: number;
  weight: number;
  price: number;
  salevalue: number;
  status: string;
}

@Component({
  selector: 'app-consumption-internal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    FormConsumptionComponent
  ],
  templateUrl: './consumption-internal.component.html',
  styleUrls: ['./consumption-internal.component.css']
})
export class ConsumptionInternalComponent {
  consumption: Consumption[] = [];
  filteredConsumption: Consumption[] = [];
  showingActive: boolean = true;
  searchTerm: string = '';
  selectedHome: string = '';
  homesList: string[] = [];
  
  // Variables para paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  // Variables para totales
  totalQuantity: number = 0;
  totalWeight: number = 0;
  totalPrice: number = 0;
  totalSaleValue: number = 0;

  // Control de diálogo
  showDialog: boolean = false;
  selectedConsumption: Consumption | null = null;

  // Control de dropdown de exportación
  showExportDropdown: boolean = false;

  constructor(private consumptionService: ConsumptionService) {
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', () => this.closeExportDropdown());
  }

  ngOnInit(): void {
    this.loadConsumption();
  }

  // Cerrar dropdown al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-dropdown-container')) {
      this.closeExportDropdown();
    }
  }

  toggleExportDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;
  }

  closeExportDropdown(): void {
    this.showExportDropdown = false;
  }

  loadConsumption(): void {
    const service = this.showingActive
      ? this.consumptionService.listActiveConsumptions()
      : this.consumptionService.listInactiveConsumptions();

    service.subscribe({
      next: (data: Consumption[]) => {
        this.consumption = data;
        this.filteredConsumption = [...data];
        this.calculateTotals();
        this.loadHomesList();
      },
      error: (err) => {
        console.error('Error cargando consumos:', err);
        Swal.fire('Error', 'No se pudo cargar los registros de consumo', 'error');
      }
    });
  }

  loadHomesList(): void {
    this.homesList = [...new Set(this.consumption.map(item => item.names))];
  }

  calculateTotals(): void {
    this.totalQuantity = this.filteredConsumption.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.totalWeight = this.filteredConsumption.reduce((sum, item) => sum + (item.weight || 0), 0);
    this.totalPrice = this.filteredConsumption.reduce((sum, item) => sum + (item.price || 0), 0);
    this.totalSaleValue = this.filteredConsumption.reduce((sum, item) => sum + (item.salevalue || 0), 0);
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredConsumption = [...this.consumption];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredConsumption = this.consumption.filter(c =>
        c.names.toLowerCase().includes(term) ||
        c.id_consumption.toString().includes(term) ||
        this.formatDate(c.date).includes(term)
      );
    }
    this.calculateTotals();
  }

  toggleConsumption(): void {
    this.showingActive = !this.showingActive;
    this.loadConsumption();
  }

  openFormConsumption(consumption?: Consumption): void {
    this.selectedConsumption = consumption || null;
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.selectedConsumption = null;
  }

  handleDialogResult(result: boolean): void {
    this.closeDialog();
    if (result) {
      this.loadConsumption();
      Swal.fire(
        'Éxito',
        this.selectedConsumption ? 'Consumo actualizado correctamente' : 'Consumo registrado correctamente',
        'success'
      );
    }
  }

  toggleConsumptionState(id: number, status: string): void {
    const isActive = status === 'A';
    const action = isActive ? 'inactivateConsumption' : 'restoreConsumption';
    const actionText = isActive ? 'desactivar' : 'activar';

    Swal.fire({
      title: `¿${isActive ? 'Desactivar' : 'Activar'} consumo?`,
      text: `¿Está seguro que desea ${actionText} este registro?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#d33' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consumptionService[action](id).subscribe({
          next: () => {
            Swal.fire(
              'Éxito',
              `Consumo ${isActive ? 'desactivado' : 'activado'} correctamente`,
              'success'
            );
            this.loadConsumption();
          },
          error: (err) => {
            console.error(err);
            Swal.fire(
              'Error',
              `No se pudo ${actionText} el consumo`,
              'error'
            );
          }
        });
      }
    });
  }

  downloadPDF(): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const tableStartY = 40;

    // Encabezado del reporte
    doc.setFontSize(20);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE CONSUMO INTERNO', pageWidth / 2, 15, { align: 'center' });

    // Información adicional
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, margin, 25);
    doc.text(`Filtro: ${this.showingActive ? 'Activos' : 'Inactivos'}`, margin, 30);
    doc.text(`Total registros: ${this.filteredConsumption.length}`, pageWidth - margin, 25, { align: 'right' });

    // Tabla de datos
    autoTable(doc, {
      head: [['ID', 'Fecha', 'Hogar', 'Cantidad', 'Peso (kg)', 'Precio Unit.', 'Valor Venta', 'Estado']],
      body: this.filteredConsumption.map(c => [
        c.id_consumption.toString(),
        this.formatDate(c.date),
        c.names,
        c.quantity.toString(),
        c.weight.toFixed(2),
        `S/. ${c.price.toFixed(2)}`,
        `S/. ${c.salevalue.toFixed(2)}`,
        c.status === 'A' ? 'Activo' : 'Inactivo'
      ]),
      startY: tableStartY,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [33, 82, 177],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240] 
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Página ${data.pageNumber}`,
          pageWidth - margin,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'right' }
        );
      }
    });

    // Sección de totales
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE TOTALES', margin, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      body: [
        ['Cantidad Total:', this.totalQuantity.toString()],
        ['Peso Total:', `${this.totalWeight.toFixed(2)} kg`],
        ['Precio Promedio:', `S/. ${(this.totalPrice / this.filteredConsumption.length).toFixed(2)}`],
        ['Valor Total:', `S/. ${this.totalSaleValue.toFixed(2)}`]
      ],
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        1: { textColor: 0 }
      }
    });

    doc.save(`Reporte_Consumo_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  downloadHomeReport(): void {
    if (!this.selectedHome) {
      Swal.fire('Advertencia', 'Por favor seleccione un hogar para generar el reporte', 'warning');
      return;
    }

    const homeData = this.filteredConsumption.filter(c => c.names === this.selectedHome);

    if (homeData.length === 0) {
      Swal.fire('Información', 'No hay datos de consumo para el hogar seleccionado', 'info');
      return;
    }

    this.generateHomeReportPDF(homeData);
  }

  private generateHomeReportPDF(data: Consumption[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm'
    });

    const homeName = data[0].names;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado con nombre del hogar
    doc.setFontSize(18);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text(`REPORTE DE CONSUMO - ${homeName.toUpperCase()}`, pageWidth / 2, 20, { align: 'center' });

    // Información del reporte
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, margin, 30);
    doc.text(`Total registros: ${data.length}`, pageWidth - margin, 30, { align: 'right' });

    // Cálculo de totales para el hogar
    const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalWeight = data.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalValue = data.reduce((sum, item) => sum + (item.salevalue || 0), 0);
    const averagePrice = totalValue / data.length;

    // Tabla de datos del hogar
    autoTable(doc, {
      head: [['Fecha', 'Cantidad', 'Peso (kg)', 'Precio Unit.', 'Valor Venta']],
      body: data.map(c => [
        this.formatDate(c.date),
        c.quantity.toString(),
        c.weight.toFixed(2),
        `S/. ${c.price.toFixed(2)}`,
        `S/. ${c.salevalue.toFixed(2)}`
      ]),
      startY: 40,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [58, 123, 213],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Página ${data.pageNumber}`,
          pageWidth - margin,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      }
    });

    // Sección de totales para el hogar
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTALES PARA ${homeName.toUpperCase()}`, margin, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      body: [
        ['Cantidad Total:', totalQuantity.toString()],
        ['Peso Total:', `${totalWeight.toFixed(2)} kg`],
        ['Precio Promedio:', `S/. ${averagePrice.toFixed(2)}`],
        ['Valor Total:', `S/. ${totalValue.toFixed(2)}`]
      ],
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', cellWidth: 50 },
        1: { textColor: 0, cellWidth: 40 }
      }
    });

    doc.save(`Reporte_Consumo_${homeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  downloadExcel(): void {
    const data = this.filteredConsumption.map(c => ({
      'ID': c.id_consumption,
      'Fecha': this.formatDate(c.date),
      'Hogar': c.names,
      'Cantidad': c.quantity,
      'Peso (kg)': c.weight,
      'Precio Unitario': c.price,
      'Valor Venta': c.salevalue,
      'Estado': c.status === 'A' ? 'Activo' : 'Inactivo'
    }));

    data.push({
      'ID': 'TOTALES' as any,
      'Fecha': '',
      'Hogar': '',
      'Cantidad': this.totalQuantity,
      'Peso (kg)': this.totalWeight,
      'Precio Unitario': (this.totalPrice / this.filteredConsumption.length),
      'Valor Venta': this.totalSaleValue,
      'Estado': ''
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Consumos');
    XLSX.writeFile(wb, `Reporte_Consumo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  downloadCSV(): void {
    let csv = 'ID;Fecha;Hogar;Cantidad;Peso (kg);Precio Unitario;Valor Venta;Estado\n';

    this.filteredConsumption.forEach(c => {
      csv += `${c.id_consumption};`;
      csv += `${this.formatDate(c.date)};`;
      csv += `${c.names.replace(/;/g, ',')};`;
      csv += `${c.quantity};`;
      csv += `${c.weight.toFixed(2)};`;
      csv += `${c.price.toFixed(2)};`;
      csv += `${c.salevalue.toFixed(2)};`;
      csv += `${c.status === 'A' ? 'Activo' : 'Inactivo'}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Consumo_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}