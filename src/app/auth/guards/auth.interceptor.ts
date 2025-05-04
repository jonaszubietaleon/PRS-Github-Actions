import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../../service/auth.services';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Debugging logs
  console.log(`Interceptando petición a: ${req.url}, ruta actual: ${window.location.pathname}`);

  // Skip interceptor for authentication endpoints and token verification
  if (req.url.includes('/auth/login') || 
      req.url.includes('/auth/register') || 
      req.url.includes('/auth/verify') ||  // Skip token verification endpoint
      // Skip for login page requests (assets, API calls from login page)
      (window.location.pathname === '/Login' && !req.url.includes('/api/')) 
     ) {
    console.log('Petición excluida del interceptor:', req.url);
    return next(req);
  }

  // Get token from localStorage
  const token = localStorage.getItem('token');
  const isTokenValid = token && !authService.isTokenExpired();
  console.log('Estado del token:', { existe: !!token, valido: isTokenValid });

  // If no token exists or token is expired AND we're not already on the login page
  if ((!token || authService.isTokenExpired()) && window.location.pathname !== '/Login') {
    console.log('Token inválido o expirado. Preparando redirección a login.');
    
    // Set a flag to prevent infinite redirect loops
    if (!sessionStorage.getItem('redirectedFromAuthGuard')) {
      console.log('Estableciendo flag de redirección y navegando a login');
      sessionStorage.setItem('redirectedFromAuthGuard', 'true');
      // También indicar que hubo error de autenticación
      sessionStorage.setItem('authErrorRedirect', 'true');
      router.navigateByUrl('/Login');
    } else {
      console.log('Ya se había redirigido previamente, evitando bucle');
    }
    
    return throwError(() => new Error('No hay token de autenticación o el token ha expirado'));
  }

  // If we have a token, add it to the request
  if (token) {
    console.log('Añadiendo token a la petición');
    // Add token to the request
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    // Process the modified request
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only handle auth errors if we're not already on the login page
        if (window.location.pathname !== '/Login') {
          // Handle 401 Unauthorized errors
          if (error.status === 401) {
            console.log('Error 401: Token expirado o inválido. Redirigiendo al login...');
            localStorage.removeItem('token');
            localStorage.removeItem('sessionExpiry');
            
            // Set flag to prevent loops
            sessionStorage.setItem('redirectedFromAuthGuard', 'true');
            // También indicar que hubo error de autenticación
            sessionStorage.setItem('authErrorRedirect', 'true');
            router.navigateByUrl('/Login');
          }
          
          // Handle 403 Forbidden errors
          if (error.status === 403) {
            console.log('Error 403: No tienes permisos para acceder a este recurso');
            // Opcional: redirigir a una página de acceso denegado
            // router.navigateByUrl('/access-denied');
          }
          
          // If token is about to expire, try to refresh it and retry the request
          if (error.status === 401 && authService.isAuthenticated()) {
            console.log('Intentando renovar token...');
            return authService.refreshTokenIfNeeded().pipe(
              switchMap(newToken => {
                if (newToken) {
                  console.log('Token renovado con éxito, reintentando petición');
                  // Clone the request with the new token and retry
                  const retryReq = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newToken}`
                    }
                  });
                  return next(retryReq);
                }
                // If refresh failed, redirect to login
                console.log('Error al renovar token, redirigiendo a login');
                sessionStorage.setItem('redirectedFromAuthGuard', 'true');
                sessionStorage.setItem('authErrorRedirect', 'true');
                router.navigateByUrl('/Login');
                return throwError(() => new Error('Error al renovar el token'));
              }),
              catchError(refreshError => {
                console.error('Error al renovar el token:', refreshError);
                sessionStorage.setItem('redirectedFromAuthGuard', 'true');
                sessionStorage.setItem('authErrorRedirect', 'true');
                router.navigateByUrl('/Login');
                return throwError(() => refreshError);
              })
            );
          }
        } else {
          console.log('Error en petición pero ya estamos en login, no redirigiendo:', error);
        }
        
        return throwError(() => error);
      })
    );
  }

  // If we're on login page and have no token, just proceed with the request
  console.log('Procediendo con la petición sin modificaciones');
  return next(req);
};