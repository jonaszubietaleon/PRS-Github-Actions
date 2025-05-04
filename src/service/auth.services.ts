import { inject, Injectable, signal } from "@angular/core";
import { catchError, from, Observable, switchMap, of, tap, throwError, map, finalize, timer, take, BehaviorSubject } from "rxjs";
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, user, User, AuthErrorCodes, onAuthStateChanged } from "@angular/fire/auth";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { UserInterface } from "../model/user.interface";
import { Router } from "@angular/router";
import { isPlatformBrowser } from "@angular/common";
import { PLATFORM_ID } from "@angular/core";

// Definir interfaces para las respuestas del backend
interface AuthResponse {
  success: boolean;
  message?: string;
  expiresIn?: number;
  [key: string]: any; // Para permitir otras propiedades
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private firebaseAuth = inject(Auth);
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  user$ = user(this.firebaseAuth);
  currentUserSig = signal<UserInterface | null>(null);
  
  // Bandera para control de autenticación y persistencia
  isLoadingAuth = signal<boolean>(true);
  isAuthInitialized = signal<boolean>(false);
  private authStateSubject = new BehaviorSubject<boolean>(false);
  authState$ = this.authStateSubject.asObservable();
  
  private apiUrl = 'https://8081-vallegrande-microservic-3aq4p4nrcyl.ws-us118.gitpod.io/api';
  
  // Bandera para indicar si una operación de autenticación está en progreso
  private authInProgress = signal<boolean>(false);
  
  // Bandera para indicar si el backend está disponible
  private backendAvailable = signal<boolean>(false);

  constructor() {
    if (this.isBrowser) {
      // Inicializar la verificación de persistencia de autenticación
      this.initAuthListener();
      
      // Verificar estado de backend al iniciar
      this.checkBackendAvailability();
    }
  }
  
  // Inicializar el listener de autenticación para persistencia
  private initAuthListener(): void {
    // Establecer isLoadingAuth en true mientras se verifica
    this.isLoadingAuth.set(true);
    
    onAuthStateChanged(this.firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        // Configurar el objeto de usuario cuando hay un usuario autenticado
        this.currentUserSig.set({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || '',
          displayName: firebaseUser.displayName || ''
        });
        
        // Verificar el token y refrescarlo si es necesario
        this.refreshTokenIfNeeded().pipe(
          take(1),
          tap(token => {
            if (token) {
              // Actualizar token en localStorage
              this.setLocalStorageItem('token', token);
              
              // Si no hay fecha de expiración o está próxima a expirar, establecer una nueva
              if (this.isTokenExpired() || this.isTokenAboutToExpire()) {
                const expiryTime = new Date().getTime() + (3600 * 1000); // 1 hora
                this.setLocalStorageItem('sessionExpiry', expiryTime.toString());
              }
              
              // Actualizar el estado de autenticación
              this.authStateSubject.next(true);
            }
          })
        ).subscribe({
          complete: () => {
            this.isLoadingAuth.set(false);
            this.isAuthInitialized.set(true);
          }
        });
      } else {
        // Limpiar el objeto de usuario cuando no hay usuario autenticado
        this.currentUserSig.set(null);
        this.authStateSubject.next(false);
        
        // Verificar si hay un token pero no hay usuario y limpiarlo
        if (this.getLocalStorageItem('token')) {
          this.removeLocalStorageItem('token');
          this.removeLocalStorageItem('sessionExpiry');
        }
        
        this.isLoadingAuth.set(false);
        this.isAuthInitialized.set(true);
      }
    }, (error) => {
      console.error('Error en el listener de autenticación:', error);
      this.isLoadingAuth.set(false);
      this.isAuthInitialized.set(true);
    });
  }
  
  // Verificar si el token está por expirar (menos de 10 minutos)
  isTokenAboutToExpire(): boolean {
    if (!this.isBrowser) return true;
    
    const expiryTimeStr = this.getLocalStorageItem('sessionExpiry');
    if (!expiryTimeStr) return true;
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    const tenMinutesInMs = 10 * 60 * 1000;
    
    return (expiryTime - new Date().getTime()) < tenMinutesInMs;
  }
  
  // Verificar si el backend está disponible
  private checkBackendAvailability(): void {
    // Hacer una solicitud simple para verificar si el backend está disponible
    if (this.isBrowser) {
      this.http.get<any>(`${this.apiUrl}/health-check`, { observe: 'response' })
        .pipe(
          this.timeoutRequest(5000), // Timeout de 5 segundos
          catchError(error => {
            console.log('Backend no disponible:', error);
            this.backendAvailable.set(false);
            return of(null);
          })
        )
        .subscribe(response => {
          if (response && response.status === 200) {
            this.backendAvailable.set(true);
          } else {
            this.backendAvailable.set(false);
          }
        });
    }
  }

  // Limpiar tokens inválidos o expirados
  private cleanupInvalidTokens(): void {
    if (!this.isBrowser) return;
    
    // Si hay un token, verificar si es válido o está expirado
    const token = this.getLocalStorageItem('token');
    if (token) {
      // Si el token está expirado, eliminarlo
      if (this.isTokenExpired()) {
        console.log('Token expirado, eliminando');
        this.removeLocalStorageItem('token');
        this.removeLocalStorageItem('sessionExpiry');
      }
    }
  }

  // Métodos seguros para acceder a localStorage
  private getLocalStorageItem(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error al acceder a localStorage:', e);
      return null;
    }
  }

  private setLocalStorageItem(key: string, value: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error al escribir en localStorage:', e);
    }
  }

  private removeLocalStorageItem(key: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error al eliminar de localStorage:', e);
    }
  }

  // Obtener el ID Token del usuario actual
  private getToken(): Promise<string | null> {
    return this.firebaseAuth.currentUser?.getIdToken(true) ?? Promise.resolve(null);
  }

  // Registro de nuevo usuario
  register(email: string, username: string, password: string): Observable<any> {
    // Prevenir múltiples operaciones de autenticación simultáneas
    if (this.authInProgress()) {
      return throwError(() => new Error('Hay una operación de autenticación en progreso'));
    }
    
    this.authInProgress.set(true);
    
    return from(createUserWithEmailAndPassword(this.firebaseAuth, email, password))
      .pipe(
        switchMap((userCredential) => {
          const user = userCredential.user;
          return from(updateProfile(user, { displayName: username }));
        }),
        switchMap(() => this.firebaseAuth.currentUser ? from(this.firebaseAuth.currentUser.getIdToken()) : of(null)),
        switchMap(token => {
          if (token) {
            this.setLocalStorageItem('token', token);
            
            // Establecer tiempo de expiración predeterminado (1 hora)
            const expiryTime = new Date().getTime() + (3600 * 1000);
            this.setLocalStorageItem('sessionExpiry', expiryTime.toString());
            
            // Enviar datos al backend solo si está disponible
            if (this.backendAvailable()) {
              return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
                email: email,
                username: username,
                displayName: username
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                }
              }).pipe(
                catchError(error => {
                  console.error('Error al registrar en el backend:', error);
                  return of({ success: true, message: 'Usuario registrado en Firebase, pero hubo un error en el backend' });
                })
              );
            } else {
              return of({ success: true, message: 'Usuario registrado en Firebase, backend no disponible' });
            }
          }
          return of(null);
        }),
        catchError((error: any) => {
          console.error("Error en el registro:", error);
          throw error;
        }),
        finalize(() => {
          this.authInProgress.set(false);
        })
      );
  }

  // Iniciar sesión
  login(email: string, password: string): Observable<any> {
    // Prevenir múltiples operaciones de autenticación simultáneas
    if (this.authInProgress()) {
      return throwError(() => new Error('Hay una operación de autenticación en progreso'));
    }
    
    this.authInProgress.set(true);
    
    return from(signInWithEmailAndPassword(this.firebaseAuth, email, password))
      .pipe(
        switchMap(response => from(response.user.getIdToken(true))),
        tap(token => {
          this.setLocalStorageItem('token', token);
          
          // Establecer tiempo de expiración predeterminado (1 hora)
          const expiryTime = new Date().getTime() + (3600 * 1000);
          this.setLocalStorageItem('sessionExpiry', expiryTime.toString());
          
          // Actualizar estado de autenticación
          this.authStateSubject.next(true);
        }),
        // Verificar con el backend solo si está disponible
        switchMap(token => {
          if (this.backendAvailable()) {
            return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
              email: email
            }, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              }
            }).pipe(
              tap(response => {
                // Actualizar tiempo de expiración si el backend lo proporciona
                if (response && response.expiresIn) {
                  const expiryTime = new Date().getTime() + (response.expiresIn * 1000);
                  this.setLocalStorageItem('sessionExpiry', expiryTime.toString());
                }
              }),
              catchError(error => {
                console.error('Error al verificar login con backend:', error);
                return of({ success: true });
              })
            );
          } else {
            return of({ success: true, message: 'Login correcto en Firebase, backend no disponible' });
          }
        }),
        catchError((error: any) => {
          console.error('Error en login:', error);
          
          // Manejar errores específicos de Firebase Auth
          if (error.code === AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
            return throwError(() => ({ 
              code: 'auth/invalid-credential', 
              message: 'Credenciales inválidas'
            }));
          }
          
          throw error;
        }),
        finalize(() => {
          this.authInProgress.set(false);
        })
      );
  }

  // Cerrar sesión
  logout(): Observable<void> {
    // Limpiar el almacenamiento local antes de cerrar sesión
    this.removeLocalStorageItem('token');
    this.removeLocalStorageItem('sessionExpiry');
    
    // Actualizar estado de autenticación
    this.authStateSubject.next(false);
    
    return from(signOut(this.firebaseAuth))
      .pipe(
        tap(() => {
          // Opcionalmente, mantener credenciales recordadas si el usuario marcó "recordarme"
          if (this.getLocalStorageItem('rememberMe') === 'true') {
            // No eliminamos las credenciales recordadas
          } else {
            this.removeLocalStorageItem('rememberedEmail');
            this.removeLocalStorageItem('rememberedPassword');
            this.removeLocalStorageItem('rememberMe');
          }
          
          // Redirigir al login
          this.router.navigateByUrl('/Login');
        }),
        catchError(error => {
          console.error('Error al cerrar sesión:', error);
          // Asegurar que el usuario sea redirigido incluso si hay un error
          this.router.navigateByUrl('/Login');
          return throwError(() => error);
        })
      );
  }

  // Obtener el usuario actual
  getCurrentUser(): UserInterface | null {
    return this.currentUserSig();
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    // Primero verificar si la inicialización está completa
    if (!this.isAuthInitialized()) {
      // Si estamos en proceso de inicialización, confiar en localStorage
      const token = this.getLocalStorageItem('token');
      return token !== null && !this.isTokenExpired();
    }
    
    // Para estar autenticado, necesitamos:
    // 1. Tener un usuario en Firebase
    // 2. Tener un token válido y no expirado
    const user = this.currentUserSig();
    const token = this.getLocalStorageItem('token');
    
    return user !== null && token !== null && !this.isTokenExpired();
  }

  // Verificar token con el backend
  verifyTokenWithBackend(): Observable<AuthResponse> {
    // Si el backend no está disponible, devolver éxito local
    if (!this.backendAvailable()) {
      // En lugar de error, permitir continuar con autenticación local
      return of({ success: true, message: 'Backend no disponible, usando autenticación local' });
    }
    
    return from(this.getToken()).pipe(
      switchMap((idToken) => {
        if (idToken) {
          return this.http.get<AuthResponse>(`${this.apiUrl}/auth/verifyToken`, {
            headers: { Authorization: `Bearer ${idToken}` }
          }).pipe(
            map(response => {
              // Actualizar tiempo de expiración de la sesión si el servidor lo proporciona
              if (response && response.expiresIn) {
                const expiryTime = new Date().getTime() + (response.expiresIn * 1000);
                this.setLocalStorageItem('sessionExpiry', expiryTime.toString());
              }
              return response;
            }),
            catchError(error => {
              if (error.status === 401) {
                // Token inválido o expirado, intentar renovarlo antes de redirigir
                return this.refreshTokenIfNeeded().pipe(
                  switchMap(newToken => {
                    if (newToken) {
                      // Token renovado correctamente
                      this.setLocalStorageItem('token', newToken);
                      const expiryTime = new Date().getTime() + (3600 * 1000); // 1 hora
                      this.setLocalStorageItem('sessionExpiry', expiryTime.toString());
                      return of({ success: true, message: 'Token renovado exitosamente' });
                    } else {
                      // No se pudo renovar el token, forzar logout
                      this.removeLocalStorageItem('token');
                      this.removeLocalStorageItem('sessionExpiry');
                      this.router.navigateByUrl('/Login');
                      return throwError(() => new Error('No se pudo renovar el token'));
                    }
                  }),
                  catchError(refreshError => {
                    console.error('Error al renovar token:', refreshError);
                    this.removeLocalStorageItem('token');
                    this.removeLocalStorageItem('sessionExpiry');
                    this.router.navigateByUrl('/Login');
                    return throwError(() => refreshError);
                  })
                );
              }
              console.error('Error al verificar token:', error);
              // Si es otro tipo de error, permitir continuar con la sesión local
              return of({ success: true, message: 'Error al verificar con backend, usando autenticación local' });
            })
          );
        } else {
          // Si no hay token pero hay un usuario en Firebase, intentar obtener uno nuevo
          if (this.firebaseAuth.currentUser) {
            return this.refreshTokenIfNeeded().pipe(
              switchMap(newToken => {
                if (newToken) {
                  this.setLocalStorageItem('token', newToken);
                  const expiryTime = new Date().getTime() + (3600 * 1000); // 1 hora
                  this.setLocalStorageItem('sessionExpiry', expiryTime.toString());
                  return of({ success: true, message: 'Token generado exitosamente' });
                }
                return throwError(() => new Error('No se pudo generar un nuevo token'));
              })
            );
          }
          
          return throwError(() => new Error('No hay usuario autenticado'));
        }
      })
    );
  }
  
  // Verificar si el token está expirado basado en el tiempo almacenado localmente
  isTokenExpired(): boolean {
    if (!this.isBrowser) return true;
    
    const expiryTimeStr = this.getLocalStorageItem('sessionExpiry');
    if (!expiryTimeStr) return true;
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    return new Date().getTime() > expiryTime;
  }
  
  // Renovar token
  refreshTokenIfNeeded(): Observable<string | null> {
    if (this.firebaseAuth.currentUser) {
      return from(this.firebaseAuth.currentUser.getIdToken(true)).pipe(
        tap(token => {
          if (token) {
            // Actualizar token en localStorage
            this.setLocalStorageItem('token', token);
            
            // Establecer nuevo tiempo de expiración
            const expiryTime = new Date().getTime() + (3600 * 1000); // 1 hora
            this.setLocalStorageItem('sessionExpiry', expiryTime.toString());
          }
        }),
        catchError(error => {
          console.error('Error al refrescar token:', error);
          return of(null);
        })
      );
    }
    return of(null);
  }
  
  // Método de timeout para usar en RxJS pipes
  private timeoutRequest<T>(ms: number) {
    return (source: Observable<T>) => {
      return source.pipe(
        switchMap(value => {
          return timer(0, ms).pipe(
            take(1),
            map(() => value)
          );
        })
      );
    };
  }
}