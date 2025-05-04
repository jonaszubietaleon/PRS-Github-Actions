import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { MENU_ITEMS } from '../../utils/menu-items';
import { AuthService } from '../../../service/auth.services';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-sidemenu',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './sidemenu.component.html',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class SidemenuComponent implements OnInit, OnDestroy {
  dropdownIndex: number | null = null;
  subDropdownIndex: Map<number, number | null> = new Map();
  grandSubDropdownIndex: Map<number, Map<number, number | null>> = new Map();
  menuItems = MENU_ITEMS;
  isSidebarOpen = false;
  
  // Control del modal de logout
  logoutModalOpen = false;

  private resizeListener: any;
  private sidebarToggleListener: any;
  private isBrowser: boolean;
  private logoutSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.sidebarToggleListener = this.listenForSidebarToggle();
      this.resizeListener = this.handleResize();
      this.checkScreenSize();
      
      // Establecer el dropdown inicial si hay una ruta activa
      this.checkActiveRoute();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.resizeListener);
      window.removeEventListener('sidebar-toggle', this.sidebarToggleListener);
    }
    
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
  }

  private listenForSidebarToggle(): any {
    const listener = (event: any) => {
      if (event.detail && event.detail.hasOwnProperty('isOpen')) {
        this.isSidebarOpen = event.detail.isOpen;
      }
    };

    window.addEventListener('sidebar-toggle', listener);
    return listener;
  }

  private handleResize(): any {
    const listener = () => {
      this.checkScreenSize();
    };

    window.addEventListener('resize', listener);
    return listener;
  }

  private checkScreenSize(): void {
    if (window.innerWidth >= 1024) {
      this.isSidebarOpen = true;
    } else {
      this.isSidebarOpen = false;
    }
  }

  /**
   * Verifica la ruta activa y abre los dropdowns correspondientes
   */
  private checkActiveRoute(): void {
    const currentUrl = this.router.url;
    
    // Recorrer los elementos del menú para encontrar coincidencias con la URL actual
    this.menuItems.forEach((item, index) => {
      if (this.checkPathMatch(item, currentUrl)) {
        this.dropdownIndex = index;
      }
      
      if (item.children) {
        item.children.forEach((child, childIndex) => {
          if (this.checkPathMatch(child, currentUrl)) {
            this.dropdownIndex = index;
            this.subDropdownIndex.set(index, childIndex);
          }
          
          if (child.children) {
            child.children.forEach((grandChild, grandChildIndex) => {
              if (this.checkPathMatch(grandChild, currentUrl)) {
                this.dropdownIndex = index;
                this.subDropdownIndex.set(index, childIndex);
                
                if (!this.grandSubDropdownIndex.has(index)) {
                  this.grandSubDropdownIndex.set(index, new Map());
                }
                this.grandSubDropdownIndex.get(index)!.set(childIndex, grandChildIndex);
              }
            });
          }
        });
      }
    });
  }

  /**
   * Verifica si la ruta del elemento coincide con la URL actual
   */
  private checkPathMatch(item: any, currentUrl: string): boolean {
    return item.path && (currentUrl === item.path || currentUrl.startsWith(item.path + '/'));
  }

  toggleDropdown(index: number): void {
    this.dropdownIndex = this.dropdownIndex === index ? null : index;
  }

  toggleSubDropdown(parentIndex: number, childIndex: number): void {
    const current = this.subDropdownIndex.get(parentIndex);
    this.subDropdownIndex.set(parentIndex, current === childIndex ? null : childIndex);
  }

  toggleGrandSubDropdown(parentIndex: number, childIndex: number, grandChildIndex: number): void {
    if (!this.grandSubDropdownIndex.has(parentIndex)) {
      this.grandSubDropdownIndex.set(parentIndex, new Map());
    }
    const subMap = this.grandSubDropdownIndex.get(parentIndex)!;
    const current = subMap.get(childIndex);
    subMap.set(childIndex, current === grandChildIndex ? null : grandChildIndex);
  }

  closeSidebar(): void {
    if (window.innerWidth < 1024) {
      this.isSidebarOpen = false;
    }
  }

  isRouteActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  // Método para abrir el modal de confirmación
  openLogoutModal(): void {
    this.logoutModalOpen = true;
  }

  // Método para cerrar el modal de confirmación
  closeLogoutModal(): void {
    this.logoutModalOpen = false;
  }

  // Método modificado para mostrar el modal en lugar de cerrar sesión directamente
  logout(): void {
    this.openLogoutModal();
  }

  // Método para confirmar el cierre de sesión utilizando el AuthService
  confirmLogout(): void {
    // Cancelamos cualquier suscripción previa que pudiera existir
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }

    // Utilizamos el servicio de autenticación para cerrar sesión
    this.logoutSubscription = this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
        this.closeLogoutModal();
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        this.closeLogoutModal();
      }
    });
  }
}