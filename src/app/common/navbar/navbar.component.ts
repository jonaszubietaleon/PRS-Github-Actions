import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.services';
import { UserInterface } from '../../../model/user.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  userMenuOpen = false;
  
  // Para comunicar con el sidebar
  sidebarOpen = false;
  
  // Control del modal de logout
  logoutModalOpen = false;

  // Información del usuario actual
  currentUser: UserInterface | null = null;

  // Referencia al documento para detectar clics fuera del menú
  private documentClickListener: any;
  private userSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Añadir listener para cerrar el menú cuando se hace clic fuera
    this.documentClickListener = this.handleDocumentClick.bind(this);
    document.addEventListener('click', this.documentClickListener);
    
    // Suscribirse a los cambios del usuario
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email || '',
          username: user.displayName || '',
          displayName: user.displayName || '',
          role: 'Usuario' // Por defecto asignamos rol de Usuario
        };
      } else {
        this.currentUser = null;
      }
    });
  }

  ngOnDestroy(): void {
    // Eliminar listener cuando el componente se destruye
    document.removeEventListener('click', this.documentClickListener);
    
    // Limpiar suscripción
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  handleDocumentClick(event: MouseEvent): void {
    // Obtener el elemento en el que se hizo clic
    const target = event.target as HTMLElement;
    
    // Comprobar si el clic fue fuera del menú de usuario
    const userMenuContainer = document.querySelector('.group.relative');
    if (this.userMenuOpen && userMenuContainer && !userMenuContainer.contains(target)) {
      this.userMenuOpen = false;
    }
  }

  toggleMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.menuOpen = !this.menuOpen;
  }

  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.userMenuOpen = !this.userMenuOpen;
  }
  
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    // Emitir evento para el componente sidebar
    this.emitSidebarToggle();
  }
  
  // Método para emitir el evento de cambio de sidebar
  private emitSidebarToggle(): void {
    const event = new CustomEvent('sidebar-toggle', {
      detail: { isOpen: this.sidebarOpen }
    });
    window.dispatchEvent(event);
  }

  // Método para formatear el email mostrando solo primeras 3 letras
  formatEmail(email: string | undefined): string {
    if (!email) return '';
    
    const atIndex = email.indexOf('@');
    if (atIndex <= 0) return email;
    
    // Mostrar solo las 3 primeras letras + 6 asteriscos + @dominio.com
    const firstPart = email.substring(0, Math.min(3, atIndex));
    const domain = email.substring(atIndex);
    
    return firstPart + '******' + domain;
  }

  // Método para abrir el modal de confirmación
  openLogoutModal(): void {
    this.userMenuOpen = false; // Cerrar el menú de usuario cuando se abre el modal
    this.logoutModalOpen = true;
  }

  // Método para cerrar el modal de confirmación
  closeLogoutModal(): void {
    this.logoutModalOpen = false;
  }

  // Método para confirmar el cierre de sesión
  confirmLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada exitosamente');
        this.closeLogoutModal(); // Cerrar el modal antes de navegar
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        this.closeLogoutModal();
        // El servicio de autenticación maneja la redirección en caso de error
      }
    });
  }
}