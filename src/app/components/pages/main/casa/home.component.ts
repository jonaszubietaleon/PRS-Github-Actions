import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import { HomeService } from "../../../../../service/home.service";
import { FormHomeComponent } from "./form-home/form-home.component";

interface Home {
  id_home: number;
  names: string;
  address: string;
  status: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    FormHomeComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  homes: Home[] = [];
  filteredHomes: Home[] = [];
  showingActive: boolean = true;
  searchTerm: string = '';
  homeToEdit: Home | null = null;
  
  // Control de diálogo
  showDialog: boolean = false;
  
  // Control de dropdown de exportación
  showExportDropdown: boolean = false;

  displayedColumns: string[] = [
    "id_home",
    "names",
    "address",
    "status",
    "actions"
  ];

  constructor(private homeService: HomeService) {}

  ngOnInit(): void {
    this.loadHomes();
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

  loadHomes(): void {
    const service = this.showingActive
      ? this.homeService.getActiveHomes()
      : this.homeService.getInactiveHomes();

    service.subscribe({
      next: (data: Home[]) => {
        this.homes = data;
        this.filteredHomes = [...data];
      },
      error: (err) => {
        console.error("Error al cargar homes:", err);
        Swal.fire("Error", "No se pudieron cargar los homes.", "error");
      }
    });
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredHomes = [...this.homes];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredHomes = this.homes.filter(h => 
        h.names.toLowerCase().includes(term) || 
        h.address.toLowerCase().includes(term) ||
        h.id_home.toString().includes(term)
      );
    }
  }

  downloadPDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
    doc.setFontSize(20);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE HOMES', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Filtro: ${this.showingActive ? 'Activos' : 'Inactivos'}`, 14, 30);
    doc.text(`Total registros: ${this.filteredHomes.length}`, 190, 25, { align: 'right' });

    autoTable(doc, {
      head: [['ID', 'Nombre', 'Dirección', 'Estado']],
      body: this.filteredHomes.map(h => [
        h.id_home.toString(),
        h.names,
        h.address,
        h.status === 'A' ? 'Activo' : 'Inactivo'
      ]),
      startY: 35,
      margin: { left: 10, right: 10 },
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
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 45 },
        2: { cellWidth: 80 },
        3: { cellWidth: 20 }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Página ${data.pageNumber}`,
          data.settings.margin.right,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'right' }
        );
      }
    });

    doc.save(`Reporte_Homes_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  downloadExcel(): void {
    const data = this.filteredHomes.map(h => ({
      'ID': h.id_home,
      'Nombre': h.names,
      'Dirección': h.address,
      'Estado': h.status === 'A' ? 'Activo' : 'Inactivo'
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 50 },
      { wch: 12 }
    ];
    
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Homes');
    XLSX.writeFile(wb, `Reporte_Homes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  downloadCSV(): void {
    let csv = 'ID;Nombre;Dirección;Estado\n';
    
    this.filteredHomes.forEach(h => {
      csv += `${h.id_home};`;
      csv += `${h.names.replace(/;/g, ',')};`;
      csv += `${h.address.replace(/;/g, ',')};`;
      csv += `${h.status === 'A' ? 'Activo' : 'Inactivo'}\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Homes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  toggleHomes(): void {
    this.showingActive = !this.showingActive;
    this.loadHomes();
  }

  editHome(home: Home): void {
    this.homeToEdit = home;
    this.showDialog = true;
  }

  handleDialogResult(result: boolean): void {
    this.showDialog = false;
    this.homeToEdit = null;
    if (result) {
      this.loadHomes();
      Swal.fire(
        'Éxito', 
        this.homeToEdit ? 'El home ha sido actualizado' : 'El home ha sido registrado', 
        'success'
      );
    }
  }

  toggleHomeState(id: number, names: string, status: string): void {
    const isActive = status === "A";
    const action = isActive ? "deactivateHome" : "reactivateHome";

    Swal.fire({
      title: `¿${isActive ? 'Desactivar' : 'Activar'} home?`,
      text: `¿Estás seguro de querer ${isActive ? 'desactivar' : 'activar'} "${names}"?`,
      icon: isActive ? 'warning' : 'info',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#d33' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${isActive ? 'desactivar' : 'activar'}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.homeService[action](id).subscribe({
          next: () => {
            Swal.fire(
              'Éxito',
              `El home ha sido ${isActive ? 'desactivado' : 'activado'} correctamente`,
              'success'
            );
            this.loadHomes();
          },
          error: (err) => {
            console.error(`Error al ${isActive ? 'desactivar' : 'activar'} el home:`, err);
            Swal.fire(
              'Error',
              `No se pudo ${isActive ? 'desactivar' : 'activar'} el home`,
              'error'
            );
          }
        });
      }
    });
  }

  openFormHome(): void {
    this.homeToEdit = null;
    this.showDialog = true;
  }
}