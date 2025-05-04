import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  dashboardCards = [
    {
      title: 'Gallinas',
      description: 'Gestión y seguimiento de gallinas',
      icon: 'chicken',
      route: '/Modulo-Galpon/Gallinas',
      color: 'from-amber-500 to-yellow-400'
    },
    {
      title: 'Producción de huevos',
      description: 'Control de producción diaria',
      icon: 'egg',
      route: '/Modulo-Galpon/Producción-de-huevos',
      color: 'from-cyan-500 to-blue-400'
    },
    {
      title: 'Galpón',
      description: 'Administración de espacios',
      icon: 'home',
      route: '/Modulo-Galpon/Galpon',
      color: 'from-red-500 to-orange-400'
    },
    {
      title: 'Alimento',
      description: 'Control de alimentación',
      icon: 'utensils',
      route: '/Modulo-Galpon/Alimento',
      color: 'from-green-500 to-emerald-400'
    },
    {
      title: 'Vacunas',
      description: 'Calendario y registro de vacunación',
      icon: 'syringe',
      route: '/Modulo-Galpon/Vacunas',
      color: 'from-purple-500 to-violet-400'
    },
    {
      title: 'Ciclo de vida',
      description: 'Control del ciclo productivo',
      icon: 'refresh-cw',
      route: '/Modulo-Galpon/Ciclo-de-vida',
      color: 'from-teal-500 to-cyan-400'
    },
    {
      title: 'Kardex',
      description: 'Movimientos de inventario de huevos',
      icon: 'clipboard-list',
      route: '/Modulo-Galpon/Kardex',
      color: 'from-indigo-500 to-blue-400'
    },
    {
      title: 'Kardex de Procesos',
      description: 'Control de procesos productivos',
      icon: 'list-checks',
      route: '/Modulo-Galpon/Kardex-de-Procesos',
      color: 'from-blue-500 to-indigo-400'
    },
    {
      title: 'Kardex Materias Primas',
      description: 'Gestión de inventario de insumos',
      icon: 'package',
      route: '/Modulo-Galpon/Kardex-Materias-Primas',
      color: 'from-emerald-500 to-green-400'
    },
    {
      title: 'Ventas',
      description: 'Registro y control de ventas',
      icon: 'shopping-cart',
      route: '/Modulo-Galpon/Ventas',
      color: 'from-pink-500 to-rose-400'
    }
  ];

  // Stats para el panel superior
  stats = [
    { title: 'Total Gallinas', value: '5,240', trend: '+3.2%', icon: 'bird', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
    { title: 'Producción Diaria', value: '4,827', trend: '+2.7%', icon: 'egg', bgColor: 'bg-cyan-100', textColor: 'text-cyan-700' },
    { title: 'Galpones Activos', value: '12', trend: '0%', icon: 'home', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    { title: 'Eficiencia', value: '92%', trend: '+1.2%', icon: 'bar-chart-2', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' }
  ];

  // Datos simulados para el panel de alertas
  alerts = [
    { title: 'Vacunación pendiente', message: 'Galpón #3 requiere vacunación programada', severity: 'high', date: '2025-05-05', icon: 'alert-triangle' },
    { title: 'Stock bajo de alimento', message: 'El alimento tipo A está por debajo del nivel mínimo', severity: 'medium', date: '2025-05-04', icon: 'alert-circle' },
    { title: 'Producción reducida', message: 'Galpón #5 reporta reducción del 5% en producción', severity: 'medium', date: '2025-05-03', icon: 'trending-down' }
  ];

  // Para controles de filtro rápido
  selectedPeriod = 'week';
  // Datos simulados para gráfico
  chartData = [
    { day: 'Lun', production: 4810 },
    { day: 'Mar', production: 4920 },
    { day: 'Mié', production: 4780 },
    { day: 'Jue', production: 4850 },
    { day: 'Vie', production: 4827 },
    { day: 'Sáb', production: 4790 },
    { day: 'Dom', production: 4760 }
  ];

  constructor() {}

  ngOnInit(): void {
    // Aquí podrías inicializar datos o hacer llamadas a servicios
  }

  changeTimePeriod(period: string) {
    this.selectedPeriod = period;
    // Aquí se implementaría la lógica para actualizar datos según el período
  }

  getIconClass(icon: string): string {
    // Mapea nuestros nombres de iconos a clases de Fontawesome o el sistema de iconos que utilices
    return `icon-${icon}`;
  }
}