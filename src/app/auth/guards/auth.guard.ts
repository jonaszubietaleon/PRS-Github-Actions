import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../../service/auth.services';
import { map, take, catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

// Guard para rutas protegidas - Solo usuarios autenticados pueden acceder
export const authGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const targetUrl = state.url;

  // Solo ejecutar lógica en el navegador
  if (!isPlatformBrowser(platformId)) {
    console.log('No estamos en un navegador, bloqueando acceso');
    return of(false);
  }

  // Verificación inmediata basada en el estado actual
  // Esta verificación es crítica y debe ser estricta
  if (!authService.isAuthenticated()) {
    console.log('No autenticado, redirigiendo a login');
    // Limpiar cualquier token antiguo para asegurar un inicio de sesión limpio
    localStorage.removeItem('token');
    localStorage.removeItem('sessionExpiry');
    
    router.navigate(['/Login'], { queryParams: { returnUrl: targetUrl } });
    return of(false);
  }

  // Doble verificación con Firebase para asegurar que el usuario está realmente autenticado
  return authService.user$.pipe(
    take(1),
    map(user => {
      // Si hay usuario y el token es válido
      if (user && !authService.isTokenExpired()) {
        return true;
      }
      
      console.log('Token inválido o expirado, haciendo logout');
      // Forzar logout y redirigir a login
      authService.logout().subscribe();
      router.navigate(['/Login'], { queryParams: { returnUrl: targetUrl } });
      return false;
    }),
    catchError(error => {
      console.error('Error en authGuard:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('sessionExpiry');
      router.navigate(['/Login']);
      return of(false);
    })
  );
};

// Guard para rutas de login/registro - Solo usuarios NO autenticados pueden acceder
export const loginGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  // Solo ejecutar lógica en el navegador
  if (!isPlatformBrowser(platformId)) {
    return of(true); // Permitir acceso a login si no estamos en navegador
  }

  // Verificación local para decisión rápida
  if (localStorage.getItem('token') === null) {
    console.log('No hay token, permitiendo acceso a login/register');
    return of(true);
  }

  // Si hay token pero ha expirado, permitir acceso a login
  if (authService.isTokenExpired()) {
    console.log('Token expirado, permitiendo acceso a login/register');
    localStorage.removeItem('token');
    localStorage.removeItem('sessionExpiry');
    return of(true);
  }

  // Verificación adicional usando el observable user$
  return authService.user$.pipe(
    take(1),
    map(user => {
      // Si hay usuario activo y token válido, redirigir a Dashboard
      if (user && !authService.isTokenExpired()) {
        console.log('Usuario activo detectado, redirigiendo a Dashboard');
        router.navigate(['/Dashboard']);
        return false;
      }
      
      // Si no hay usuario activo, permitir acceso a login/register
      console.log('No hay usuario activo, permitiendo acceso a login/register');
      return true;
    }),
    catchError(error => {
      // En caso de error, limpiar tokens y permitir acceso a login
      console.error('Error en loginGuard:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('sessionExpiry');
      return of(true);
    })
  );
};